import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Compass,
  Coffee,
  Utensils,
  Smile,
  FileText,
  Sparkles,
  GripVertical,
  Layers,
  List,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { ScheduleItem } from '../types';

export const ScheduleView: React.FC = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useWorkshop();

  // View preferences
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [activeDayTab, setActiveDayTab] = useState<'all' | 'Day 1' | 'Day 2'>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Drag and drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: 'Day 1' | 'Day 2'; hour: number } | null>(null);

  // Form state
  const [selectedDay, setSelectedDay] = useState<'Day 1' | 'Day 2'>('Day 1');
  const [time, setTime] = useState('10:00 - 11:30');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'이동' | '식사' | '세션' | '팀빌딩' | '휴식' | '기타'>('세션');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // 08:00 to 23:00 timeline hours
  const START_HOUR = 8;
  const END_HOUR = 23;
  const [hourHeight, setHourHeight] = useState<number>(130); // 130px default per hour (spacious for 30-min events)
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

  // Helper: parse "10:30 - 12:00" or "10:30~12:00" into total minutes from midnight
  const parseTimeDetails = (timeStr: string) => {
    const defaultStart = { hour: 12, min: 0 };
    const defaultEnd = { hour: 13, min: 0 };

    if (!timeStr) {
      return {
        startHour: 12,
        startMin: 0,
        endHour: 13,
        endMin: 0,
        startTotalMins: 12 * 60,
        endTotalMins: 13 * 60,
        durationMins: 60,
        formattedStart: '12:00',
        formattedEnd: '13:00',
      };
    }

    const parts = timeStr.split(/[-~]/).map((s) => s.trim());

    const parseHM = (s: string) => {
      const match = s.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return { hour: parseInt(match[1], 10), min: parseInt(match[2], 10) };
      }
      const matchH = s.match(/(\d{1,2})/);
      if (matchH) {
        return { hour: parseInt(matchH[1], 10), min: 0 };
      }
      return null;
    };

    const start = parseHM(parts[0]) || defaultStart;
    let end = parts[1] ? parseHM(parts[1]) : null;

    if (!end) {
      end = { hour: start.hour + 1, min: start.min };
    }

    if (end.hour < start.hour || (end.hour === start.hour && end.min <= start.min)) {
      end = { hour: start.hour + 1, min: start.min };
    }

    const startTotalMins = start.hour * 60 + start.min;
    const endTotalMins = end.hour * 60 + end.min;
    const durationMins = Math.max(15, endTotalMins - startTotalMins);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formattedStart = `${pad(start.hour)}:${pad(start.min)}`;
    const formattedEnd = `${pad(end.hour)}:${pad(end.min)}`;

    return {
      startHour: start.hour,
      startMin: start.min,
      endHour: end.hour,
      endMin: end.min,
      startTotalMins,
      endTotalMins,
      durationMins,
      formattedStart,
      formattedEnd,
    };
  };

  // Compute position and height relative to 08:00
  const getPositionStyle = (timeStr: string) => {
    const { startTotalMins, durationMins } = parseTimeDetails(timeStr);
    const dayStartMins = START_HOUR * 60; // 08:00 = 480 mins

    const relativeStartMins = Math.max(0, startTotalMins - dayStartMins);
    const top = (relativeStartMins / 60) * hourHeight;
    const height = Math.max(56, (durationMins / 60) * hourHeight);

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  // Compute drop update
  const computeNewTimeOnDrop = (oldTimeStr: string, newStartHour: number): string => {
    const { durationMins } = parseTimeDetails(oldTimeStr);

    const newStartTotalMins = newStartHour * 60;
    const newEndTotalMins = newStartTotalMins + durationMins;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    const startH = Math.floor(newStartTotalMins / 60);
    const startM = newStartTotalMins % 60;
    const endH = Math.floor(newEndTotalMins / 60);
    const endM = newEndTotalMins % 60;

    return `${pad(startH)}:${pad(startM)} - ${pad(endH)}:${pad(endM)}`;
  };

  const handleDropOnSlot = async (
    e: React.DragEvent,
    targetDay: 'Day 1' | 'Day 2',
    targetHour: number
  ) => {
    e.preventDefault();
    setDragOverSlot(null);
    const itemId = e.dataTransfer.getData('text/plain') || draggingId;
    if (!itemId) return;

    const item = schedules.find((s) => s.id === itemId);
    if (!item) return;

    const newTime = computeNewTimeOnDrop(item.time, targetHour);
    await updateSchedule(item.id, {
      day: targetDay,
      time: newTime,
    });
    setDraggingId(null);
  };

  const getCategoryIcon = (cat: ScheduleItem['category']) => {
    switch (cat) {
      case '이동':
        return <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      case '식사':
        return <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case '세션':
        return <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case '팀빌딩':
        return <Smile className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
      case '휴식':
        return <Coffee className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      default:
        return <CalendarIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  const getCategoryBadgeClass = (cat: ScheduleItem['category']) => {
    switch (cat) {
      case '이동':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '식사':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case '세션':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case '팀빌딩':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case '휴식':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingItem) {
      await updateSchedule(editingItem.id, {
        day: selectedDay,
        time,
        title,
        category,
        location,
        description,
      });
      setEditingItem(null);
    } else {
      await addSchedule({
        day: selectedDay,
        time,
        title,
        category,
        location,
        description,
        order: schedules.length + 1,
      });
    }

    setTitle('');
    setDescription('');
    setLocation('');
    setShowAddModal(false);
  };

  const openAddForSlot = (day: 'Day 1' | 'Day 2', hour: number, minute: number = 0) => {
    setEditingItem(null);
    setSelectedDay(day);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const startStr = `${pad(hour)}:${pad(minute)}`;
    const endTotal = hour * 60 + minute + (minute === 0 ? 60 : 30);
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const endStr = `${pad(endH)}:${pad(endM)}`;
    setTime(`${startStr} - ${endStr}`);
    setTitle('');
    setLocation('');
    setDescription('');
    setShowAddModal(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setSelectedDay(item.day);
    setTime(item.time);
    setTitle(item.title);
    setCategory(item.category);
    setLocation(item.location || '');
    setDescription(item.description || '');
    setShowAddModal(true);
  };

  // Sorted items per day
  const day1Items = schedules
    .filter((s) => s.day === 'Day 1')
    .sort((a, b) => parseTimeDetails(a.time).startTotalMins - parseTimeDetails(b.time).startTotalMins);

  const day2Items = schedules
    .filter((s) => s.day === 'Day 2')
    .sort((a, b) => parseTimeDetails(a.time).startTotalMins - parseTimeDetails(b.time).startTotalMins);

  const formatDurationText = (mins: number) => {
    if (mins < 60) return `${mins}분`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>🗓️ 워크숍 일정표</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            시작 시각과 진행 시간에 맞추어 타임라인에 자동으로 시각 배치됩니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Day Tab Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveDayTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeDayTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 (Day 1 & 2)
            </button>
            <button
              type="button"
              onClick={() => setActiveDayTab('Day 1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeDayTab === 'Day 1'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day 1
            </button>
            <button
              type="button"
              onClick={() => setActiveDayTab('Day 2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeDayTab === 'Day 2'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day 2
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'timeline'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="시간 비례 타임라인 뷰"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">타임라인</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="순서별 리스트 뷰"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">순서 리스트</span>
            </button>
          </div>

          {/* Timeline Spacing Selector (Only in timeline mode) */}
          {viewMode === 'timeline' && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200/60 text-xs">
              <span className="text-[10px] text-slate-500 font-bold px-1.5 hidden sm:inline">칸 간격:</span>
              <button
                type="button"
                onClick={() => setHourHeight(100)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                  hourHeight === 100
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="1시간 = 100px (30분 = 50px)"
              >
                보통
              </button>
              <button
                type="button"
                onClick={() => setHourHeight(130)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  hourHeight === 130
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="1시간 = 130px (30분 = 65px - 제목 잘 보임!)"
              >
                넓게
              </button>
              <button
                type="button"
                onClick={() => setHourHeight(160)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                  hourHeight === 160
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="1시간 = 160px (30분 = 80px - 매우 여유로움)"
              >
                매우 넓게
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setSelectedDay('Day 1');
              setTime('10:00 - 11:30');
              setTitle('');
              setDescription('');
              setLocation('');
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>일정 추가</span>
          </button>
        </div>
      </div>

      {/* PROPORTIONAL TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 bg-slate-100/90 border-b border-slate-200 text-xs font-bold text-slate-700 sticky top-0 z-20">
            <div className="col-span-2 sm:col-span-2 p-3 text-center border-r border-slate-200 text-slate-500 flex items-center justify-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>시각</span>
            </div>

            {(activeDayTab === 'all' || activeDayTab === 'Day 1') && (
              <div
                className={`${
                  activeDayTab === 'all' ? 'col-span-5 sm:col-span-5' : 'col-span-10 sm:col-span-10'
                } p-3 text-center border-r border-slate-200 font-extrabold text-emerald-800 bg-emerald-50/80 flex items-center justify-center`}
              >
                <span>Day 1 (첫째 날)</span>
              </div>
            )}

            {(activeDayTab === 'all' || activeDayTab === 'Day 2') && (
              <div
                className={`${
                  activeDayTab === 'all' ? 'col-span-5 sm:col-span-5' : 'col-span-10 sm:col-span-10'
                } p-3 text-center font-extrabold text-teal-800 bg-teal-50/80 flex items-center justify-center`}
              >
                <span>Day 2 (둘째 날)</span>
              </div>
            )}
          </div>

          {/* Continuous Timeline Canvas Container */}
          <div className="relative flex">
            {/* Hour Scale Column */}
            <div className="w-2/12 sm:w-2/12 border-r border-slate-200 bg-slate-50/80 shrink-0">
              {hours.map((hour) => {
                const hourLabel = hour < 10 ? `0${hour}:00` : `${hour}:00`;
                return (
                  <div
                    key={hour}
                    style={{ height: `${hourHeight}px` }}
                    className="border-b border-slate-200/80 relative text-center flex flex-col items-center justify-between py-2 px-1"
                  >
                    <span className="text-xs font-extrabold text-slate-700 font-mono tracking-tight">
                      {hourLabel}
                    </span>
                    {/* 30-min guideline label */}
                    <div className="w-full flex items-center justify-end pr-2 text-[10px] text-slate-400 font-mono">
                      <span>:30</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day Columns Container */}
            <div className="w-10/12 sm:w-10/12 relative flex divide-x divide-slate-200">
              {/* Day 1 Column Canvas */}
              {(activeDayTab === 'all' || activeDayTab === 'Day 1') && (
                <div
                  className={`${
                    activeDayTab === 'all' ? 'w-1/2' : 'w-full'
                  } relative bg-emerald-50/10 min-h-full`}
                  style={{ height: `${hours.length * hourHeight}px` }}
                >
                  {/* Background Hour Lines with :00 and :30 Quick Add */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      style={{ height: `${hourHeight}px` }}
                      className="border-b border-slate-100/90 relative group/slot"
                    >
                      {/* Half Hour Guideline Line */}
                      <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-200/70" />

                      {/* Top Half (:00 Quick Add) */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 group/top flex items-start justify-end p-1">
                        <button
                          type="button"
                          onClick={() => openAddForSlot('Day 1', hour, 0)}
                          className="p-1 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold opacity-0 group-hover/top:opacity-100 transition z-10 shadow-2xs flex items-center space-x-1"
                          title={`${hour}:00 일정 추가`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{hour}:00 추가</span>
                        </button>
                      </div>

                      {/* Bottom Half (:30 Quick Add) */}
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 group/bottom flex items-end justify-end p-1">
                        <button
                          type="button"
                          onClick={() => openAddForSlot('Day 1', hour, 30)}
                          className="p-1 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold opacity-0 group-hover/bottom:opacity-100 transition z-10 shadow-2xs flex items-center space-x-1"
                          title={`${hour}:30 일정 추가`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{hour}:30 추가</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Day 1 Scheduled Event Cards Positioned Proportionally */}
                  {day1Items.map((item) => {
                    const posStyle = getPositionStyle(item.time);
                    const details = parseTimeDetails(item.time);

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', item.id);
                          setDraggingId(item.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        style={{
                          top: posStyle.top,
                          height: posStyle.height,
                        }}
                        className={`absolute left-2 right-2 z-10 bg-white border border-emerald-300 hover:border-emerald-600 rounded-xl p-2 shadow-2xs hover:shadow-md transition duration-150 group/card cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden ${
                          draggingId === item.id ? 'opacity-40 scale-95 border-emerald-600' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          {/* Time & Category Bar */}
                          <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                            <span
                              className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${getCategoryBadgeClass(
                                item.category
                              )}`}
                            >
                              {getCategoryIcon(item.category)}
                              <span>{item.category}</span>
                            </span>

                            <span className="text-[10px] font-bold text-slate-600 font-mono flex items-center space-x-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/70 truncate">
                              <Clock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>{details.formattedStart} ~ {details.formattedEnd}</span>
                              <span className="text-[9px] text-emerald-700 font-semibold ml-0.5">
                                ({formatDurationText(details.durationMins)})
                              </span>
                            </span>
                          </div>

                          {/* Title - clearly displayed without cutoff */}
                          <h4
                            className="text-xs font-bold text-slate-900 leading-snug break-words line-clamp-2 mt-0.5"
                            title={item.title}
                          >
                            {item.title}
                          </h4>

                          {/* Location */}
                          {item.location && (
                            <p className="text-[10px] text-emerald-700 font-medium flex items-center space-x-0.5 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </p>
                          )}

                          {/* Description if height allows */}
                          {item.description && details.durationMins >= 45 && (
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Action buttons on Hover */}
                        <div className="absolute top-1.5 right-1.5 hidden group-hover/card:flex items-center space-x-0.5 bg-white/95 backdrop-blur-xs p-0.5 rounded-lg shadow-2xs border border-slate-200 z-20">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
                            title="수정"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSchedule(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Day 2 Column Canvas */}
              {(activeDayTab === 'all' || activeDayTab === 'Day 2') && (
                <div
                  className={`${
                    activeDayTab === 'all' ? 'w-1/2' : 'w-full'
                  } relative bg-teal-50/10 min-h-full`}
                  style={{ height: `${hours.length * hourHeight}px` }}
                >
                  {/* Background Hour Lines with :00 and :30 Quick Add */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      style={{ height: `${hourHeight}px` }}
                      className="border-b border-slate-100/90 relative group/slot"
                    >
                      {/* Half Hour Line */}
                      <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-200/70" />

                      {/* Top Half (:00 Quick Add) */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 group/top flex items-start justify-end p-1">
                        <button
                          type="button"
                          onClick={() => openAddForSlot('Day 2', hour, 0)}
                          className="p-1 bg-white hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-md text-[10px] font-bold opacity-0 group-hover/top:opacity-100 transition z-10 shadow-2xs flex items-center space-x-1"
                          title={`${hour}:00 일정 추가`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{hour}:00 추가</span>
                        </button>
                      </div>

                      {/* Bottom Half (:30 Quick Add) */}
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 group/bottom flex items-end justify-end p-1">
                        <button
                          type="button"
                          onClick={() => openAddForSlot('Day 2', hour, 30)}
                          className="p-1 bg-white hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-md text-[10px] font-bold opacity-0 group-hover/bottom:opacity-100 transition z-10 shadow-2xs flex items-center space-x-1"
                          title={`${hour}:30 일정 추가`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{hour}:30 추가</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Day 2 Scheduled Event Cards Positioned Proportionally */}
                  {day2Items.map((item) => {
                    const posStyle = getPositionStyle(item.time);
                    const details = parseTimeDetails(item.time);

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', item.id);
                          setDraggingId(item.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        style={{
                          top: posStyle.top,
                          height: posStyle.height,
                        }}
                        className={`absolute left-2 right-2 z-10 bg-white border border-teal-300 hover:border-teal-600 rounded-xl p-2 shadow-2xs hover:shadow-md transition duration-150 group/card cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden ${
                          draggingId === item.id ? 'opacity-40 scale-95 border-teal-600' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          {/* Time & Category Bar */}
                          <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                            <span
                              className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${getCategoryBadgeClass(
                                item.category
                              )}`}
                            >
                              {getCategoryIcon(item.category)}
                              <span>{item.category}</span>
                            </span>

                            <span className="text-[10px] font-bold text-slate-600 font-mono flex items-center space-x-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/70 truncate">
                              <Clock className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                              <span>{details.formattedStart} ~ {details.formattedEnd}</span>
                              <span className="text-[9px] text-teal-700 font-semibold ml-0.5">
                                ({formatDurationText(details.durationMins)})
                              </span>
                            </span>
                          </div>

                          {/* Title - clearly displayed without cutoff */}
                          <h4
                            className="text-xs font-bold text-slate-900 leading-snug break-words line-clamp-2 mt-0.5"
                            title={item.title}
                          >
                            {item.title}
                          </h4>

                          {/* Location */}
                          {item.location && (
                            <p className="text-[10px] text-teal-700 font-medium flex items-center space-x-0.5 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </p>
                          )}

                          {/* Description if height allows */}
                          {item.description && details.durationMins >= 45 && (
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Action buttons on Hover */}
                        <div className="absolute top-1.5 right-1.5 hidden group-hover/card:flex items-center space-x-0.5 bg-white/95 backdrop-blur-xs p-0.5 rounded-lg shadow-2xs border border-slate-200 z-20">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="p-1 text-slate-400 hover:text-teal-600 rounded transition"
                            title="수정"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSchedule(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHRONOLOGICAL SEQUENTIAL LIST VIEW */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Day 1 List */}
          {(activeDayTab === 'all' || activeDayTab === 'Day 1') && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-emerald-800 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Day 1 (첫째 날 일정)</span>
                </h3>
              </div>

              {day1Items.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">등록된 Day 1 일정이 없습니다.</p>
              ) : (
                <div className="space-y-3 relative">
                  {day1Items.map((item, index) => {
                    const details = parseTimeDetails(item.time);
                    const nextItem = day1Items[index + 1];
                    const nextDetails = nextItem ? parseTimeDetails(nextItem.time) : null;
                    const gapMins = nextDetails
                      ? nextDetails.startTotalMins - details.endTotalMins
                      : null;

                    return (
                      <React.Fragment key={item.id}>
                        <div className="group rounded-2xl p-4 border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white hover:border-emerald-400 transition shadow-2xs relative">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeClass(
                                item.category
                              )}`}
                            >
                              {getCategoryIcon(item.category)}
                              <span>{item.category}</span>
                            </span>

                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-black text-emerald-900 font-mono bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                                {details.formattedStart} ~ {details.formattedEnd}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                ({formatDurationText(details.durationMins)})
                              </span>
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>

                          {item.location && (
                            <p className="text-xs text-emerald-700 font-medium flex items-center space-x-1 mb-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.location}</span>
                            </p>
                          )}

                          {item.description && (
                            <p className="text-xs text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-100 leading-relaxed mt-2">
                              {item.description}
                            </p>
                          )}

                          <div className="absolute top-2.5 right-2.5 hidden group-hover:flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSchedule(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Gap Indicator between sequential events */}
                        {gapMins !== null && gapMins > 0 && (
                          <div className="flex items-center justify-center my-1 text-[10px] text-slate-400 font-semibold space-x-1">
                            <div className="h-2 border-l border-dashed border-emerald-300" />
                            <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                              ☕ 여유 시간 {formatDurationText(gapMins)}
                            </span>
                            <div className="h-2 border-l border-dashed border-emerald-300" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Day 2 List */}
          {(activeDayTab === 'all' || activeDayTab === 'Day 2') && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-teal-800 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                  <span>Day 2 (둘째 날 일정)</span>
                </h3>
              </div>

              {day2Items.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">등록된 Day 2 일정이 없습니다.</p>
              ) : (
                <div className="space-y-3 relative">
                  {day2Items.map((item, index) => {
                    const details = parseTimeDetails(item.time);
                    const nextItem = day2Items[index + 1];
                    const nextDetails = nextItem ? parseTimeDetails(nextItem.time) : null;
                    const gapMins = nextDetails
                      ? nextDetails.startTotalMins - details.endTotalMins
                      : null;

                    return (
                      <React.Fragment key={item.id}>
                        <div className="group rounded-2xl p-4 border border-teal-200/80 bg-gradient-to-br from-teal-50/40 to-white hover:border-teal-400 transition shadow-2xs relative">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeClass(
                                item.category
                              )}`}
                            >
                              {getCategoryIcon(item.category)}
                              <span>{item.category}</span>
                            </span>

                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-black text-teal-900 font-mono bg-white px-2 py-0.5 rounded-lg border border-teal-200 shadow-2xs">
                                {details.formattedStart} ~ {details.formattedEnd}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                ({formatDurationText(details.durationMins)})
                              </span>
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>

                          {item.location && (
                            <p className="text-xs text-teal-700 font-medium flex items-center space-x-1 mb-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.location}</span>
                            </p>
                          )}

                          {item.description && (
                            <p className="text-xs text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-100 leading-relaxed mt-2">
                              {item.description}
                            </p>
                          )}

                          <div className="absolute top-2.5 right-2.5 hidden group-hover:flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="p-1 text-slate-400 hover:text-teal-600 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSchedule(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Gap Indicator between sequential events */}
                        {gapMins !== null && gapMins > 0 && (
                          <div className="flex items-center justify-center my-1 text-[10px] text-slate-400 font-semibold space-x-1">
                            <div className="h-2 border-l border-dashed border-teal-300" />
                            <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                              ☕ 여유 시간 {formatDurationText(gapMins)}
                            </span>
                            <div className="h-2 border-l border-dashed border-teal-300" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingItem ? '✏️ 일정 수정하기' : '🗓️ 새로운 일정 추가하기'}
            </h3>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    일자 *
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Day 1">Day 1 (첫째 날)</option>
                    <option value="Day 2">Day 2 (둘째 날)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    시간 (예: 10:30 - 12:00) *
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="10:30 - 12:00"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  일정 제목 *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 팀빌딩 활동 & 저녁 레크레이션"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    카테고리
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="이동">이동</option>
                    <option value="식사">식사</option>
                    <option value="세션">세션</option>
                    <option value="팀빌딩">팀빌딩</option>
                    <option value="휴식">휴식</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    장소
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="예: 숙소 대회의실"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  세부설명 / 참고사항
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="추가 세부 일정 정보를 적어주세요..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  {editingItem ? '수정 완료' : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
