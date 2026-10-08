import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Building2,
  Utensils,
  Car,
  PartyPopper,
  Coffee,
  Receipt,
  ArrowUpDown,
  FileSpreadsheet,
  CreditCard,
  ArrowRightLeft,
  Copy,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { BudgetItem, BudgetType, WORKSHOP_MEMBERS, MemberName } from '../types';
import { TOTAL_BUDGET_LIMIT } from '../data/initialData';

export const BudgetView: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, currentUser } = useWorkshop();

  // Sub-tab: 'planned' (예산안) | 'actual' (실제 지출) | 'comparison' (계획 vs 집행 비교)
  const [activeSubTab, setActiveSubTab] = useState<'planned' | 'actual' | 'comparison'>('planned');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Form State
  const [itemType, setItemType] = useState<BudgetType>('planned');
  const [itemTitle, setItemTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [payer, setPayer] = useState<MemberName | string>(currentUser);
  const [category, setCategory] = useState<BudgetItem['category']>('식비');
  const [date, setDate] = useState('10/18');
  const [notes, setNotes] = useState('');

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [selectedPayer, setSelectedPayer] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'order' | 'amount'>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Helper to determine item type with fallback to 'planned' for all existing items
  const getItemType = (item: BudgetItem): BudgetType => {
    return item.type || 'planned';
  };

  // Separation: Planned (예산안) vs Actual (실제 지출)
  const plannedBudgets = budgets.filter((b) => getItemType(b) === 'planned');
  const actualBudgets = budgets.filter((b) => getItemType(b) === 'actual');

  // Totals
  const plannedTotal = plannedBudgets.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const actualTotal = actualBudgets.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const plannedRemaining = TOTAL_BUDGET_LIMIT - plannedTotal;
  const actualRemaining = TOTAL_BUDGET_LIMIT - actualTotal;

  const plannedUsageRate = ((plannedTotal / TOTAL_BUDGET_LIMIT) * 100).toFixed(1);
  const actualUsageRate = ((actualTotal / TOTAL_BUDGET_LIMIT) * 100).toFixed(1);

  // Categories
  const categoryOptions: BudgetItem['category'][] = [
    '숙소',
    '식비',
    '교통',
    '레크레이션',
    '간식',
    '기타',
  ];

  // Category totals for comparison
  const plannedByCategory = categoryOptions.reduce((acc, cat) => {
    acc[cat] = plannedBudgets
      .filter((b) => b.category === cat)
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const actualByCategory = categoryOptions.reduce((acc, cat) => {
    acc[cat] = actualBudgets
      .filter((b) => b.category === cat)
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  // Payer totals for actual expenses
  const actualByPayer = actualBudgets.reduce((acc, item) => {
    const p = item.payer || '미지정';
    acc[p] = (acc[p] || 0) + (Number(item.amount) || 0);
    return acc;
  }, {} as Record<string, number>);

  const getCategoryIcon = (cat: BudgetItem['category']) => {
    switch (cat) {
      case '숙소':
        return <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case '식비':
        return <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case '교통':
        return <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case '레크레이션':
        return <PartyPopper className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case '간식':
        return <Coffee className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      default:
        return <Receipt className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
    }
  };

  const getCategoryBadgeClass = (cat: BudgetItem['category']) => {
    switch (cat) {
      case '숙소':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case '식비':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case '교통':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case '레크레이션':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case '간식':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Open Add Modal
  const openAddModal = (targetType: BudgetType = activeSubTab === 'actual' ? 'actual' : 'planned') => {
    setEditingItem(null);
    setItemType(targetType);
    setItemTitle('');
    setAmountStr('');
    setPayer(currentUser);
    setCategory('식비');
    setDate('10/18');
    setNotes('');
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (item: BudgetItem) => {
    setEditingItem(item);
    setItemType(getItemType(item));
    setItemTitle(item.item);
    setAmountStr(item.amount.toString());
    setPayer(item.payer);
    setCategory(item.category);
    setDate(item.date || '');
    setNotes(item.notes || '');
    setShowModal(true);
  };

  // Quick Action: Convert / Copy planned item to actual expense
  const openCopyToActualModal = (plannedItem: BudgetItem) => {
    setEditingItem(null);
    setItemType('actual');
    setItemTitle(plannedItem.item);
    setAmountStr(plannedItem.amount.toString());
    setPayer(plannedItem.payer || currentUser);
    setCategory(plannedItem.category);
    setDate(plannedItem.date || '10/18');
    setNotes(plannedItem.notes ? `[예산안 연계] ${plannedItem.notes}` : '[예산안 연계 결제]');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    const amountNum = parseInt(amountStr.replace(/,/g, ''), 10) || 0;

    if (editingItem) {
      await updateBudget(editingItem.id, {
        type: itemType,
        item: itemTitle.trim(),
        amount: amountNum,
        payer,
        category,
        date: date.trim(),
        notes: notes.trim(),
      });
    } else {
      await addBudget({
        type: itemType,
        item: itemTitle.trim(),
        amount: amountNum,
        payer,
        category,
        date: date.trim(),
        notes: notes.trim(),
        order: (itemType === 'actual' ? actualBudgets : plannedBudgets).length + 1,
      });
    }

    setShowModal(false);
  };

  // Items to show based on active tab
  const currentTabItems = activeSubTab === 'actual' ? actualBudgets : plannedBudgets;

  // Filter & sort
  const filteredItems = currentTabItems
    .filter((b) => {
      const matchCat = selectedCategory === '전체' || b.category === selectedCategory;
      const matchPayer = selectedPayer === '전체' || b.payer === selectedPayer;
      const matchQuery =
        !searchQuery.trim() ||
        b.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        b.payer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchPayer && matchQuery;
    })
    .sort((a, b) => {
      if (sortField === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      return sortDirection === 'asc' ? (a.order || 0) - (b.order || 0) : (b.order || 0) - (a.order || 0);
    });

  const filteredTotal = filteredItems.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* TOP HEADER & SUB-TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">💰 예산 관리 & 지출 내역</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  총 예산 {TOTAL_BUDGET_LIMIT.toLocaleString()}원
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                사전 계획된 <span className="font-semibold text-slate-700">예산안</span>과 현장에서 결제된 <span className="font-semibold text-slate-700">실제 지출</span>을 분리하여 투명하게 정산합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAddModal(activeSubTab === 'actual' ? 'actual' : 'planned')}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition shrink-0 ${
                activeSubTab === 'actual'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{activeSubTab === 'actual' ? '실제 지출(영수증) 등록' : '예산안 항목 추가'}</span>
            </button>
          </div>
        </div>

        {/* TAB BUTTONS: [예산안 탭] / [실제 지출 탭] / [비교 대시보드] */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('planned');
              setSelectedCategory('전체');
              setSelectedPayer('전체');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'planned'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📋 예산안 (사전 계획)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                activeSubTab === 'planned'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {plannedBudgets.length}건 · {plannedTotal.toLocaleString()}원
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('actual');
              setSelectedCategory('전체');
              setSelectedPayer('전체');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'actual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>💳 실제 지출 (집행/정산)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                activeSubTab === 'actual'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {actualBudgets.length}건 · {actualTotal.toLocaleString()}원
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('comparison')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'comparison'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>📊 계획 vs 집행 비교</span>
            {plannedTotal > 0 && actualTotal > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                  activeSubTab === 'comparison'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                차액 {(plannedTotal - actualTotal).toLocaleString()}원
              </span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW 1: 예산안 (사전 계획) 탭 */}
      {activeSubTab === 'planned' && (
        <div className="space-y-5">
          {/* TOP METRICS CARDS FOR PLANNED BUDGET */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Total Limit */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  총 가용 예산 한도
                </p>
                <p className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                  {TOTAL_BUDGET_LIMIT.toLocaleString()}원
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">워크숍 220만원 + 팀장님 추진비 30만원</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Planned Sum */}
            <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  예산안 편성 합계
                </p>
                <p className="text-xl font-extrabold text-emerald-900 mt-1 font-mono">
                  {plannedTotal.toLocaleString()}원
                </p>
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  총 {plannedBudgets.length}개 항목 계획 수립
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Planned Remaining */}
            <div
              className={`rounded-xl p-4 border shadow-2xs flex items-center justify-between ${
                plannedRemaining >= 0
                  ? 'bg-blue-50/70 border-blue-200/90'
                  : 'bg-rose-50/90 border-rose-300'
              }`}
            >
              <div>
                <p
                  className={`text-[11px] font-bold uppercase tracking-wide ${
                    plannedRemaining >= 0 ? 'text-blue-800' : 'text-rose-800'
                  }`}
                >
                  {plannedRemaining >= 0 ? '미배정 여유 예산' : '예산 초과 편성액'}
                </p>
                <p
                  className={`text-xl font-extrabold mt-1 font-mono ${
                    plannedRemaining >= 0 ? 'text-blue-900' : 'text-rose-700'
                  }`}
                >
                  {plannedRemaining.toLocaleString()}원
                </p>
                <p
                  className={`text-[10px] font-bold mt-0.5 ${
                    plannedRemaining >= 0 ? 'text-blue-700' : 'text-rose-600'
                  }`}
                >
                  편성률: {plannedUsageRate}%
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  plannedRemaining >= 0 ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {plannedRemaining >= 0 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>

          {/* PROGRESS & CATEGORY BREAKDOWN */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center space-x-1.5">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>예산안 계획 배정률</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] border font-bold bg-emerald-50 border-emerald-200 text-emerald-800">
                  {plannedUsageRate}% 배정됨
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  ({plannedTotal.toLocaleString()} / {TOTAL_BUDGET_LIMIT.toLocaleString()}원)
                </span>
              </div>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                style={{ width: `${Math.min(100, Math.max(0, (plannedTotal / TOTAL_BUDGET_LIMIT) * 100))}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-slate-400">카테고리별 계획:</span>
              {categoryOptions.map((cat) => {
                const catTotal = plannedByCategory[cat] || 0;
                if (catTotal === 0) return null;
                return (
                  <span
                    key={cat}
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getCategoryBadgeClass(
                      cat
                    )}`}
                  >
                    {getCategoryIcon(cat)}
                    <span>{cat}:</span>
                    <span className="font-mono">{catTotal.toLocaleString()}원</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* FILTER & SEARCH BAR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="예산 항목명, 담당자, 메모로 검색..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <span className="text-[10px] text-slate-400 px-1">분류:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-hidden"
                  >
                    <option value="전체">전체 카테고리</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <span className="text-[10px] text-slate-400 px-1">담당자:</span>
                  <select
                    value={selectedPayer}
                    onChange={(e) => setSelectedPayer(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-hidden"
                  >
                    <option value="전체">전체 멤버</option>
                    {WORKSHOP_MEMBERS.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (sortField === 'amount') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('amount');
                      setSortDirection('desc');
                    }
                  }}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    sortField === 'amount'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>금액순 ({sortDirection === 'desc' ? '높은순' : '낮은순'})</span>
                </button>
              </div>
            </div>
          </div>

          {/* PLANNED BUDGET TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No.</th>
                    <th className="py-3 px-4 w-28">카테고리</th>
                    <th className="py-3 px-4">예산 계획 항목</th>
                    <th className="py-3 px-4 text-right">계획 금액 (원)</th>
                    <th className="py-3 px-4">담당/지출자</th>
                    <th className="py-3 px-4">일정 / 비고</th>
                    <th className="py-3 px-4 text-center w-28">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-xs">등록된 예산안 항목이 없습니다.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          상단의 [예산안 항목 추가] 버튼을 눌러 새로운 계획을 등록해보세요!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => {
                      const memberObj = WORKSHOP_MEMBERS.find((m) => m.name === item.payer);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                          {/* Index */}
                          <td className="py-3 px-4 text-center font-bold text-slate-400 text-[11px] font-mono">
                            {index + 1}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeClass(
                                item.category
                              )}`}
                            >
                              {getCategoryIcon(item.category)}
                              <span>{item.category}</span>
                            </span>
                          </td>

                          {/* Item Title */}
                          <td className="py-3 px-4 font-bold text-slate-900 leading-snug">
                            {item.item}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono text-sm">
                            {item.amount.toLocaleString()}원
                          </td>

                          {/* Payer */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1.5">
                              <div
                                className={`w-5 h-5 rounded-full ${
                                  memberObj?.avatarBg || 'bg-slate-400'
                                } text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs`}
                              >
                                {item.payer.charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-800 text-xs">
                                {item.payer}
                              </span>
                            </div>
                          </td>

                          {/* Date & Notes */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {item.date && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold font-mono shrink-0 border border-slate-200">
                                  {item.date}
                                </span>
                              )}
                              <span className="text-slate-500 text-[11px] truncate max-w-xs">
                                {item.notes || '-'}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {/* Quick copy to actual expense */}
                              <button
                                type="button"
                                onClick={() => openCopyToActualModal(item)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                title="실제 지출로 등록 (실제 결제 시 복사)"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                                title="수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteBudget(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredItems.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                      <td colSpan={3} className="py-3 px-4 text-right text-xs">
                        조회된 예산안 합계 ({filteredItems.length}건):
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-extrabold text-emerald-800 font-mono">
                        {filteredTotal.toLocaleString()}원
                      </td>
                      <td colSpan={3} className="py-3 px-4 text-xs text-slate-500 font-normal">
                        (전체 가용 예산 250만원 중 {((filteredTotal / TOTAL_BUDGET_LIMIT) * 100).toFixed(1)}% 배정)
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 실제 지출 (집행/정산) 탭 */}
      {activeSubTab === 'actual' && (
        <div className="space-y-5">
          {/* TOP METRICS CARDS FOR ACTUAL EXPENSES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Total Limit */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  총 가용 예산 한도
                </p>
                <p className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                  {TOTAL_BUDGET_LIMIT.toLocaleString()}원
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">정산 한도 총액 기준</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Actual Spent Sum */}
            <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">
                  실제 지출 총액
                </p>
                <p className="text-xl font-extrabold text-blue-900 mt-1 font-mono">
                  {actualTotal.toLocaleString()}원
                </p>
                <p className="text-[10px] text-blue-700 font-medium mt-0.5">
                  총 {actualBudgets.length}건 정산 완료
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Actual Remaining */}
            <div
              className={`rounded-xl p-4 border shadow-2xs flex items-center justify-between ${
                actualRemaining >= 0
                  ? 'bg-emerald-50/70 border-emerald-200/90'
                  : 'bg-rose-50/90 border-rose-300'
              }`}
            >
              <div>
                <p
                  className={`text-[11px] font-bold uppercase tracking-wide ${
                    actualRemaining >= 0 ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {actualRemaining >= 0 ? '실제 남은 잔여 예산' : '예산 초과 집행액'}
                </p>
                <p
                  className={`text-xl font-extrabold mt-1 font-mono ${
                    actualRemaining >= 0 ? 'text-emerald-900' : 'text-rose-700'
                  }`}
                >
                  {actualRemaining.toLocaleString()}원
                </p>
                <p
                  className={`text-[10px] font-bold mt-0.5 ${
                    actualRemaining >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  실제 집행률: {actualUsageRate}%
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  actualRemaining >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {actualRemaining >= 0 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>

          {/* PROGRESS & PAYER BREAKDOWN CHIPS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center space-x-1.5">
                <PieChart className="w-4 h-4 text-blue-600" />
                <span>실제 예산 집행률</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] border font-bold bg-blue-50 border-blue-200 text-blue-800">
                  {actualUsageRate}% 집행됨
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  ({actualTotal.toLocaleString()} / {TOTAL_BUDGET_LIMIT.toLocaleString()}원)
                </span>
              </div>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="h-full rounded-full transition-all duration-500 bg-blue-500"
                style={{ width: `${Math.min(100, Math.max(0, (actualTotal / TOTAL_BUDGET_LIMIT) * 100))}%` }}
              />
            </div>

            {/* Payer Summary */}
            <div className="pt-1 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">멤버별 결제 정산:</span>
              {Object.keys(actualByPayer).length === 0 ? (
                <span className="text-[10px] text-slate-400">아직 등록된 실제 지출 내역이 없습니다.</span>
              ) : (
                Object.entries(actualByPayer).map(([pName, amt]) => {
                  const memberObj = WORKSHOP_MEMBERS.find((m) => m.name === pName);
                  return (
                    <span
                      key={pName}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full ${
                          memberObj?.avatarBg || 'bg-slate-400'
                        } text-white inline-flex items-center justify-center text-[8px]`}
                      >
                        {pName.charAt(0)}
                      </span>
                      <span>{pName}:</span>
                      <span className="font-mono text-blue-700 font-bold">{amt.toLocaleString()}원</span>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* FILTER & SEARCH BAR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="지출 항목명, 결제자, 영수증 메모로 검색..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <span className="text-[10px] text-slate-400 px-1">분류:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-hidden"
                  >
                    <option value="전체">전체 카테고리</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <span className="text-[10px] text-slate-400 px-1">지출자:</span>
                  <select
                    value={selectedPayer}
                    onChange={(e) => setSelectedPayer(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-hidden"
                  >
                    <option value="전체">전체 멤버</option>
                    {WORKSHOP_MEMBERS.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (sortField === 'amount') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('amount');
                      setSortDirection('desc');
                    }
                  }}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    sortField === 'amount'
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>금액순 ({sortDirection === 'desc' ? '높은순' : '낮은순'})</span>
                </button>
              </div>
            </div>
          </div>

          {/* ACTUAL EXPENSES TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No.</th>
                    <th className="py-3 px-4 w-28">카테고리</th>
                    <th className="py-3 px-4">실제 지출 항목</th>
                    <th className="py-3 px-4 text-right">결제 금액 (원)</th>
                    <th className="py-3 px-4">결제자(지출자)</th>
                    <th className="py-3 px-4">결제일 / 영수증 메모</th>
                    <th className="py-3 px-4 text-center w-20">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-xs">등록된 실제 지출 내역이 없습니다.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          예산안 탭의 항목에서 [실제 지출로 등록]을 누르거나 [지출 등록] 버튼으로 추가하세요!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => {
                      const memberObj = WORKSHOP_MEMBERS.find((m) => m.name === item.payer);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                          {/* Index */}
                          <td className="py-3 px-4 text-center font-bold text-slate-400 text-[11px] font-mono">
                            {index + 1}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeClass(
                                item.category
                              )}`}
                            >
                              {getCategoryIcon(item.category)}
                              <span>{item.category}</span>
                            </span>
                          </td>

                          {/* Item Title */}
                          <td className="py-3 px-4 font-bold text-slate-900 leading-snug">
                            {item.item}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 text-right font-extrabold text-blue-900 font-mono text-sm">
                            {item.amount.toLocaleString()}원
                          </td>

                          {/* Payer */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1.5">
                              <div
                                className={`w-5 h-5 rounded-full ${
                                  memberObj?.avatarBg || 'bg-slate-400'
                                } text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs`}
                              >
                                {item.payer.charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-800 text-xs">
                                {item.payer}
                              </span>
                            </div>
                          </td>

                          {/* Date & Notes */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {item.date && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold font-mono shrink-0 border border-slate-200">
                                  {item.date}
                                </span>
                              )}
                              <span className="text-slate-500 text-[11px] truncate max-w-xs">
                                {item.notes || '-'}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                title="수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteBudget(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredItems.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                      <td colSpan={3} className="py-3 px-4 text-right text-xs">
                        실제 지출 합계 ({filteredItems.length}건):
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-extrabold text-blue-900 font-mono">
                        {filteredTotal.toLocaleString()}원
                      </td>
                      <td colSpan={3} className="py-3 px-4 text-xs text-slate-500 font-normal">
                        (전체 가용 예산 250만원 중 {((filteredTotal / TOTAL_BUDGET_LIMIT) * 100).toFixed(1)}% 실제 집행)
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: 계획 vs 집행 비교 탭 */}
      {activeSubTab === 'comparison' && (
        <div className="space-y-5">
          {/* COMPARISON SUMMARY CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ArrowRightLeft className="w-4 h-4 text-slate-700" />
              <span>종합 비교: 사전 예산안 vs 실제 지출 집행</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-500 uppercase">총 가용 예산</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1 font-mono">
                  {TOTAL_BUDGET_LIMIT.toLocaleString()}원
                </p>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80">
                <p className="text-[11px] font-bold text-emerald-800 uppercase">예산안(계획) 합계</p>
                <p className="text-lg font-extrabold text-emerald-900 mt-1 font-mono">
                  {plannedTotal.toLocaleString()}원
                </p>
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">배정률 {plannedUsageRate}%</p>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80">
                <p className="text-[11px] font-bold text-blue-800 uppercase">실제 지출(집행) 합계</p>
                <p className="text-lg font-extrabold text-blue-900 mt-1 font-mono">
                  {actualTotal.toLocaleString()}원
                </p>
                <p className="text-[10px] text-blue-700 font-medium mt-0.5">집행률 {actualUsageRate}%</p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  plannedTotal - actualTotal >= 0
                    ? 'bg-teal-50/60 border-teal-200/80 text-teal-900'
                    : 'bg-rose-50/60 border-rose-200/80 text-rose-900'
                }`}
              >
                <p className="text-[11px] font-bold uppercase">
                  {plannedTotal - actualTotal >= 0 ? '예산안 대비 절감' : '예산안 대비 초과'}
                </p>
                <p className="text-lg font-extrabold mt-1 font-mono">
                  {Math.abs(plannedTotal - actualTotal).toLocaleString()}원
                </p>
                <p className="text-[10px] font-medium mt-0.5">
                  {plannedTotal - actualTotal >= 0 ? '계획보다 덜 씀 (잔여 절감)' : '계획보다 추가 지출'}
                </p>
              </div>
            </div>
          </div>

          {/* CATEGORY BY CATEGORY COMPARISON TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800">카테고리별 계획 vs 실제 집행 분석</h4>
              <span className="text-[11px] text-slate-400">카테고리별 차액 및 집행 상태</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase">
                    <th className="py-3 px-4">분류</th>
                    <th className="py-3 px-4 text-right">예산안(계획)</th>
                    <th className="py-3 px-4 text-right">실제 지출(집행)</th>
                    <th className="py-3 px-4 text-right">차액 (계획 - 집행)</th>
                    <th className="py-3 px-4 w-44">집행 진척도</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {categoryOptions.map((cat) => {
                    const planAmt = plannedByCategory[cat] || 0;
                    const actAmt = actualByCategory[cat] || 0;
                    const diff = planAmt - actAmt;
                    const pct = planAmt > 0 ? ((actAmt / planAmt) * 100).toFixed(0) : actAmt > 0 ? 100 : 0;

                    if (planAmt === 0 && actAmt === 0) return null;

                    return (
                      <tr key={cat} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeClass(
                              cat
                            )}`}
                          >
                            {getCategoryIcon(cat)}
                            <span>{cat}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                          {planAmt.toLocaleString()}원
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-900">
                          {actAmt.toLocaleString()}원
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-extrabold">
                          {diff >= 0 ? (
                            <span className="text-emerald-700">+{diff.toLocaleString()}원 (절감)</span>
                          ) : (
                            <span className="text-rose-600">{diff.toLocaleString()}원 (초과)</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                              <span>{pct}%</span>
                              <span>{actAmt.toLocaleString()} / {planAmt.toLocaleString()}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  Number(pct) > 100
                                    ? 'bg-rose-500'
                                    : Number(pct) >= 80
                                    ? 'bg-blue-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, Number(pct))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <span>
                {editingItem
                  ? '✏️ 항목 수정'
                  : itemType === 'actual'
                  ? '💳 실제 지출(영수증) 등록'
                  : '📋 새로운 예산안 항목 추가'}
              </span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher: 예산안 vs 실제 지출 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  항목 구분 *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setItemType('planned')}
                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      itemType === 'planned'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>예산안 (사전 계획)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType('actual')}
                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      itemType === 'actual'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>실제 지출 (현장 집행)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {itemType === 'actual' ? '지출 항목명 *' : '예산 항목명 *'}
                </label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder={
                    itemType === 'actual'
                      ? '예: 하나로마트 장보기 영수증'
                      : '예: 저녁 바베큐 식자재 장보기'
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    금액 (원) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="예: 150000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    카테고리 *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BudgetItem['category'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Amount Helper Buttons */}
              <div className="flex items-center space-x-1.5 pt-0.5">
                <span className="text-[10px] text-slate-400 font-bold">빠른 금액:</span>
                {[10000, 50000, 100000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      const cur = parseInt(amountStr || '0', 10);
                      setAmountStr((cur + amt).toString());
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold font-mono border border-slate-200"
                  >
                    +{amt >= 10000 ? `${amt / 10000}만` : amt}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {itemType === 'actual' ? '결제자(지출자) *' : '담당/지출 예정자 *'}
                  </label>
                  <select
                    value={payer}
                    onChange={(e) => setPayer(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {WORKSHOP_MEMBERS.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {itemType === 'actual' ? '결제 일자 (예: 10/18)' : '예정 일자 (예: 10/18)'}
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="10/18"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {itemType === 'actual' ? '영수증 / 결제 메모' : '참고사항 / 계획 메모'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    itemType === 'actual'
                      ? '예: 법인카드 결제 완료, 종이 영수증 보관 중'
                      : '예: 14인 기준 예상 단가, 사전 예약 완료'
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2.5 text-white text-xs font-semibold rounded-xl shadow-xs transition ${
                    itemType === 'actual'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {editingItem ? '수정 완료' : itemType === 'actual' ? '실제 지출 등록' : '예산안 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
