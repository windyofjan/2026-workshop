import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Task,
  ScheduleItem,
  IdeaItem,
  PlaceItem,
  GroupItem,
  BudgetItem,
  MemberName,
  WORKSHOP_MEMBERS,
  ActiveTab,
  TaskStatus,
} from '../types';
import {
  INITIAL_TASKS,
  INITIAL_SCHEDULES,
  INITIAL_IDEAS,
  INITIAL_PLACES,
  INITIAL_GROUPS,
  INITIAL_BUDGETS,
} from '../data/initialData';

interface WorkshopContextType {
  // Current logged in / active user
  currentUser: MemberName;
  setCurrentUser: (name: MemberName) => void;

  // Active tab
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Real-time state
  tasks: Task[];
  schedules: ScheduleItem[];
  ideas: IdeaItem[];
  places: PlaceItem[];
  groups: GroupItem[];
  budgets: BudgetItem[];

  // Sync state
  loading: boolean;
  isOnline: boolean;

  // Task actions
  assignTask: (taskId: string, assignee: MemberName | '미정') => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;

  // Schedule actions
  addSchedule: (item: Omit<ScheduleItem, 'id'>) => Promise<void>;
  updateSchedule: (id: string, item: Partial<ScheduleItem>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // Idea actions
  addIdea: (idea: Omit<IdeaItem, 'id'>) => Promise<void>;
  updateIdea: (ideaId: string, updates: Partial<IdeaItem>) => Promise<void>;
  voteIdea: (ideaId: string, memberName: MemberName) => Promise<void>;
  deleteIdea: (ideaId: string) => Promise<void>;

  // Place actions
  addPlace: (place: Omit<PlaceItem, 'id'>) => Promise<void>;
  updatePlace: (placeId: string, updates: Partial<PlaceItem>) => Promise<void>;
  votePlace: (placeId: string, memberName: MemberName) => Promise<void>;
  deletePlace: (placeId: string) => Promise<void>;

  // Group actions
  addGroup: (group: Omit<GroupItem, 'id'>) => Promise<void>;
  updateGroup: (groupId: string, updates: Partial<GroupItem>) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  assignMemberToGroup: (
    memberName: MemberName,
    targetGroupId: string,
    type: 'car' | 'activity'
  ) => Promise<void>;
  removeMemberFromGroup: (groupId: string, memberName: MemberName) => Promise<void>;
  setDriverForCar: (groupId: string, driverName: string) => Promise<void>;

  // Budget actions
  addBudget: (item: Omit<BudgetItem, 'id'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<BudgetItem>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Reset / Seed
  resetToInitialData: () => Promise<void>;
}

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

export const WorkshopProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Default current user stored in localStorage or '신혜'
  const [currentUser, setCurrentUser] = useState<MemberName>(() => {
    const saved = localStorage.getItem('workshop_user');
    if (saved && WORKSHOP_MEMBERS.some((m) => m.id === saved)) {
      return saved as MemberName;
    }
    return '유옥';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('checklist');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Save current user to localStorage when changed
  useEffect(() => {
    localStorage.setItem('workshop_user', currentUser);
  }, [currentUser]);

  // Seed data function if Firestore is empty
  const checkAndSeedData = async () => {
    try {
      const initDocRef = doc(db, 'system', 'initialized');
      const initSnap = await getDoc(initDocRef);

      // If system/initialized document exists, database seeding was already handled.
      // Do not re-seed even if collections are emptied by user deletions!
      if (initSnap.exists()) {
        return;
      }

      const tasksSnap = await getDocs(collection(db, 'tasks'));
      if (tasksSnap.empty) {
        const batch = writeBatch(db);
        INITIAL_TASKS.forEach((t) => {
          const docRef = doc(collection(db, 'tasks'));
          batch.set(docRef, t);
        });
        INITIAL_SCHEDULES.forEach((s) => {
          const docRef = doc(collection(db, 'schedules'));
          batch.set(docRef, s);
        });
        INITIAL_IDEAS.forEach((i) => {
          const docRef = doc(collection(db, 'ideas'));
          batch.set(docRef, i);
        });
        INITIAL_PLACES.forEach((p) => {
          const docRef = doc(collection(db, 'places'));
          batch.set(docRef, p);
        });
        INITIAL_GROUPS.forEach((g) => {
          const docRef = doc(collection(db, 'groups'));
          batch.set(docRef, g);
        });
        INITIAL_BUDGETS.forEach((b) => {
          const docRef = doc(collection(db, 'budgets'));
          batch.set(docRef, b);
        });
        await batch.commit();
      }

      // Mark initialized so future deletions stay deleted
      await setDoc(initDocRef, { initializedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Error seeding initial Firestore data:', err);
    }
  };

  // Realtime Firestore listeners
  useEffect(() => {
    checkAndSeedData();

    const unsubTasks = onSnapshot(
      collection(db, 'tasks'),
      (snapshot) => {
        const list: Task[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Task, 'id'>),
        }));
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setTasks(list);
        setLoading(false);
        setIsOnline(true);
      },
      (err) => {
        console.error('Task snapshot error:', err);
        setIsOnline(false);
      }
    );

    const unsubSchedules = onSnapshot(
      collection(db, 'schedules'),
      (snapshot) => {
        const list: ScheduleItem[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<ScheduleItem, 'id'>),
        }));
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setSchedules(list);
      }
    );

    const unsubIdeas = onSnapshot(collection(db, 'ideas'), (snapshot) => {
      const list: IdeaItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<IdeaItem, 'id'>),
      }));
      setIdeas(list);
    });

    const unsubPlaces = onSnapshot(collection(db, 'places'), (snapshot) => {
      const list: PlaceItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<PlaceItem, 'id'>),
      }));
      setPlaces(list);
    });

    const unsubGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const list: GroupItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<GroupItem, 'id'>),
      }));
      setGroups(list);
    });

    const unsubBudgets = onSnapshot(collection(db, 'budgets'), (snapshot) => {
      const list: BudgetItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<BudgetItem, 'id'>),
      }));
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setBudgets(list);
    });

    return () => {
      unsubTasks();
      unsubSchedules();
      unsubIdeas();
      unsubPlaces();
      unsubGroups();
      unsubBudgets();
    };
  }, []);

  // Task Actions
  const assignTask = async (taskId: string, assignee: MemberName | '미정') => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { assignee });
    } catch (e) {
      console.error('Error assigning task:', e);
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status });
    } catch (e) {
      console.error('Error updating task status:', e);
    }
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      await addDoc(collection(db, 'tasks'), {
        ...task,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error adding task:', e);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, updates);
    } catch (e) {
      console.error('Error updating task:', e);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (e) {
      console.error('Error deleting task:', e);
    }
  };

  // Schedule Actions
  const addSchedule = async (item: Omit<ScheduleItem, 'id'>) => {
    try {
      await addDoc(collection(db, 'schedules'), item);
    } catch (e) {
      console.error('Error adding schedule:', e);
    }
  };

  const updateSchedule = async (id: string, item: Partial<ScheduleItem>) => {
    try {
      await updateDoc(doc(db, 'schedules', id), item);
    } catch (e) {
      console.error('Error updating schedule:', e);
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (e) {
      console.error('Error deleting schedule:', e);
    }
  };

  // Idea Actions
  const addIdea = async (idea: Omit<IdeaItem, 'id'>) => {
    try {
      await addDoc(collection(db, 'ideas'), idea);
    } catch (e) {
      console.error('Error adding idea:', e);
    }
  };

  const updateIdea = async (ideaId: string, updates: Partial<IdeaItem>) => {
    try {
      await updateDoc(doc(db, 'ideas', ideaId), updates);
    } catch (e) {
      console.error('Error updating idea:', e);
    }
  };

  const voteIdea = async (ideaId: string, memberName: MemberName) => {
    try {
      const idea = ideas.find((i) => i.id === ideaId);
      if (!idea) return;
      const votes = idea.votes || [];
      const newVotes = votes.includes(memberName)
        ? votes.filter((v) => v !== memberName)
        : [...votes, memberName];
      await updateDoc(doc(db, 'ideas', ideaId), { votes: newVotes });
    } catch (e) {
      console.error('Error voting idea:', e);
    }
  };

  const deleteIdea = async (ideaId: string) => {
    try {
      await deleteDoc(doc(db, 'ideas', ideaId));
    } catch (e) {
      console.error('Error deleting idea:', e);
    }
  };

  // Place Actions
  const addPlace = async (place: Omit<PlaceItem, 'id'>) => {
    try {
      await addDoc(collection(db, 'places'), place);
    } catch (e) {
      console.error('Error adding place:', e);
    }
  };

  const updatePlace = async (placeId: string, updates: Partial<PlaceItem>) => {
    try {
      await updateDoc(doc(db, 'places', placeId), updates);
    } catch (e) {
      console.error('Error updating place:', e);
    }
  };

  const votePlace = async (placeId: string, memberName: MemberName) => {
    try {
      const place = places.find((p) => p.id === placeId);
      if (!place) return;
      const votes = place.votes || [];
      const newVotes = votes.includes(memberName)
        ? votes.filter((v) => v !== memberName)
        : [...votes, memberName];
      await updateDoc(doc(db, 'places', placeId), { votes: newVotes });
    } catch (e) {
      console.error('Error voting place:', e);
    }
  };

  const deletePlace = async (placeId: string) => {
    try {
      await deleteDoc(doc(db, 'places', placeId));
    } catch (e) {
      console.error('Error deleting place:', e);
    }
  };

  // Group Actions (Car & Activity teams)
  const addGroup = async (group: Omit<GroupItem, 'id'>) => {
    try {
      await addDoc(collection(db, 'groups'), group);
    } catch (e) {
      console.error('Error adding group:', e);
    }
  };

  const updateGroup = async (groupId: string, updates: Partial<GroupItem>) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), updates);
    } catch (e) {
      console.error('Error updating group:', e);
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await deleteDoc(doc(db, 'groups', groupId));
    } catch (e) {
      console.error('Error deleting group:', e);
    }
  };

  // Assign member to a group (removing from other groups of same type first to ensure clean team separation)
  const assignMemberToGroup = async (
    memberName: MemberName,
    targetGroupId: string,
    type: 'car' | 'activity'
  ) => {
    try {
      const relevantGroups = groups.filter((g) => g.type === type);
      const batch = writeBatch(db);

      relevantGroups.forEach((g) => {
        const currentMembers = g.members || [];
        if (g.id === targetGroupId) {
          if (!currentMembers.includes(memberName)) {
            batch.update(doc(db, 'groups', g.id), {
              members: [...currentMembers, memberName],
            });
          }
        } else {
          if (currentMembers.includes(memberName)) {
            batch.update(doc(db, 'groups', g.id), {
              members: currentMembers.filter((m) => m !== memberName),
            });
          }
        }
      });

      await batch.commit();
    } catch (e) {
      console.error('Error assigning member to group:', e);
    }
  };

  const removeMemberFromGroup = async (groupId: string, memberName: MemberName) => {
    try {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;
      const newMembers = (group.members || []).filter((m) => m !== memberName);
      const updates: Partial<GroupItem> = { members: newMembers };
      if (group.driver === memberName) {
        updates.driver = '미정';
      }
      await updateDoc(doc(db, 'groups', groupId), updates);
    } catch (e) {
      console.error('Error removing member from group:', e);
    }
  };

  const setDriverForCar = async (groupId: string, driverName: string) => {
    try {
      const carGroups = groups.filter((g) => g.type === 'car');
      const batch = writeBatch(db);

      carGroups.forEach((car) => {
        const currentMembers = car.members || [];
        if (car.id === groupId) {
          const isDriverValid = driverName && driverName !== '미정';
          let updatedMembers = [...currentMembers];
          if (isDriverValid && !updatedMembers.includes(driverName)) {
            updatedMembers.push(driverName);
          }
          batch.update(doc(db, 'groups', car.id), {
            driver: isDriverValid ? driverName : '미정',
            members: updatedMembers,
          });
        } else {
          // If driverName was previously driver or member of another car, update accordingly
          if (car.driver === driverName) {
            batch.update(doc(db, 'groups', car.id), {
              driver: '미정',
            });
          }
          if (driverName && driverName !== '미정' && currentMembers.includes(driverName)) {
            batch.update(doc(db, 'groups', car.id), {
              members: currentMembers.filter((m) => m !== driverName),
            });
          }
        }
      });

      await batch.commit();
    } catch (e) {
      console.error('Error setting car driver:', e);
    }
  };

  // Budget Actions
  const addBudget = async (item: Omit<BudgetItem, 'id'>) => {
    try {
      await addDoc(collection(db, 'budgets'), {
        ...item,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error adding budget item:', e);
    }
  };

  const updateBudget = async (id: string, updates: Partial<BudgetItem>) => {
    try {
      await updateDoc(doc(db, 'budgets', id), updates);
    } catch (e) {
      console.error('Error updating budget item:', e);
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'budgets', id));
    } catch (e) {
      console.error('Error deleting budget item:', e);
    }
  };

  // Reset to initial data
  const resetToInitialData = async () => {
    try {
      setLoading(true);
      const collections = ['tasks', 'schedules', 'ideas', 'places', 'groups', 'budgets'];
      for (const colName of collections) {
        const snap = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      const batch = writeBatch(db);
      INITIAL_TASKS.forEach((t) => {
        batch.set(doc(collection(db, 'tasks')), t);
      });
      INITIAL_SCHEDULES.forEach((s) => {
        batch.set(doc(collection(db, 'schedules')), s);
      });
      INITIAL_IDEAS.forEach((i) => {
        batch.set(doc(collection(db, 'ideas')), i);
      });
      INITIAL_PLACES.forEach((p) => {
        batch.set(doc(collection(db, 'places')), p);
      });
      INITIAL_GROUPS.forEach((g) => {
        batch.set(doc(collection(db, 'groups')), g);
      });
      INITIAL_BUDGETS.forEach((b) => {
        batch.set(doc(collection(db, 'budgets')), b);
      });
      batch.set(doc(db, 'system', 'initialized'), { initializedAt: new Date().toISOString() });
      await batch.commit();
    } catch (e) {
      console.error('Error resetting data:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkshopContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeTab,
        setActiveTab,
        tasks,
        schedules,
        ideas,
        places,
        groups,
        budgets,
        loading,
        isOnline,
        assignTask,
        updateTaskStatus,
        addTask,
        updateTask,
        deleteTask,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addIdea,
        updateIdea,
        voteIdea,
        deleteIdea,
        addPlace,
        updatePlace,
        votePlace,
        deletePlace,
        addGroup,
        updateGroup,
        deleteGroup,
        assignMemberToGroup,
        removeMemberFromGroup,
        setDriverForCar,
        addBudget,
        updateBudget,
        deleteBudget,
        resetToInitialData,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
};

export const useWorkshop = () => {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error('useWorkshop must be used within WorkshopProvider');
  }
  return context;
};
