import React, { useState } from 'react';
import { Lightbulb, ThumbsUp, Plus, Trash2, Sparkles, Filter, Pencil, ExternalLink } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { IdeaItem, WORKSHOP_MEMBERS } from '../types';

export const IdeasView: React.FC = () => {
  const { ideas, addIdea, updateIdea, voteIdea, deleteIdea, currentUser } = useWorkshop();

  const [showModal, setShowModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('전체');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<IdeaItem['category']>('팀빌딩 활동');
  const [color, setColor] = useState<IdeaItem['color']>('yellow');

  const categories = ['전체', '팀빌딩 활동', '저녁 프로그램', '준비물/참고', '기타 아이디어'];

  const colorStyles: Record<
    IdeaItem['color'],
    { bg: string; border: string; badgeBg: string; text: string }
  > = {
    yellow: {
      bg: 'bg-amber-50/90 hover:bg-amber-50',
      border: 'border-amber-200/80',
      badgeBg: 'bg-amber-100 text-amber-800',
      text: 'text-amber-900',
    },
    pink: {
      bg: 'bg-rose-50/90 hover:bg-rose-50',
      border: 'border-rose-200/80',
      badgeBg: 'bg-rose-100 text-rose-800',
      text: 'text-rose-900',
    },
    blue: {
      bg: 'bg-sky-50/90 hover:bg-sky-50',
      border: 'border-sky-200/80',
      badgeBg: 'bg-sky-100 text-sky-800',
      text: 'text-sky-900',
    },
    green: {
      bg: 'bg-emerald-50/90 hover:bg-emerald-50',
      border: 'border-emerald-200/80',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      text: 'text-emerald-900',
    },
    purple: {
      bg: 'bg-purple-50/90 hover:bg-purple-50',
      border: 'border-purple-200/80',
      badgeBg: 'bg-purple-100 text-purple-800',
      text: 'text-purple-900',
    },
  };

  const openCreateModal = () => {
    setEditingIdea(null);
    setTitle('');
    setContent('');
    setCategory('팀빌딩 활동');
    setColor('yellow');
    setShowModal(true);
  };

  const openEditModal = (idea: IdeaItem) => {
    setEditingIdea(idea);
    setTitle(idea.title);
    setContent(idea.content || '');
    setCategory(idea.category);
    setColor(idea.color || 'yellow');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingIdea) {
      await updateIdea(editingIdea.id, {
        title: title.trim(),
        content: content.trim(),
        category,
        color,
      });
    } else {
      await addIdea({
        title: title.trim(),
        content: content.trim(),
        author: currentUser,
        category,
        votes: [currentUser], // auto-vote for own idea
        color,
        createdAt: new Date().toISOString(),
      });
    }

    setTitle('');
    setContent('');
    setEditingIdea(null);
    setShowModal(false);
  };

  // Helper to format text with shortened clickable URL badges
  const renderFormattedContent = (text: string) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        let shortDisplay = part;
        try {
          const parsed = new URL(part);
          const host = parsed.hostname.replace(/^www\./, '');
          const path = parsed.pathname + parsed.search;
          const displayPath = path.length > 14 ? path.substring(0, 10) + '...' : path;
          shortDisplay = `${host}${displayPath === '/' ? '' : displayPath}`;
        } catch {
          shortDisplay = part.length > 24 ? part.substring(0, 20) + '...' : part;
        }

        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 font-semibold text-sky-800 hover:text-sky-950 bg-sky-100/90 hover:bg-sky-200/90 border border-sky-200/80 px-2 py-0.5 rounded-lg text-[11px] underline underline-offset-2 transition my-0.5 mx-0.5 align-middle shadow-2xs"
            title={`링크 열기: ${part}`}
          >
            <span>🔗 {shortDisplay}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const filteredIdeas = ideas.filter(
    (i) => filterCategory === '전체' || i.category === filterCategory
  );

  return (
    <div className="space-y-6">
      {/* Header & New Idea Button */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>💡 워크샵 아이디어 보드</span>
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
              총 {ideas.length}개
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            저녁 팀빌딩 활동, 레크레이션, 준비물, 꿀팁 아이디어를 팍팍 올려주세요!
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>아이디어 등록하기</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center space-x-1.5 overflow-x-auto py-1 no-scrollbar">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === cat
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sticky Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIdeas.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200">
            <Lightbulb className="w-10 h-10 text-amber-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500">
              아직 등록된 아이디어가 없습니다.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              팀원들과 함께할 저녁 게임이나 재미있는 보드게임 아이디어를 공유해 보세요!
            </p>
          </div>
        ) : (
          filteredIdeas.map((idea) => {
            const style = colorStyles[idea.color || 'yellow'];
            const authorInfo = WORKSHOP_MEMBERS.find((m) => m.name === idea.author);
            const votes = idea.votes || [];
            const hasVoted = votes.includes(currentUser);

            return (
              <div
                key={idea.id}
                className={`group relative rounded-2xl p-5 border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden min-w-0 ${style.bg} ${style.border}`}
              >
                <div className="min-w-0 w-full">
                  {/* Category & Author Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${style.badgeBg}`}
                    >
                      {idea.category}
                    </span>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full ${
                          authorInfo?.avatarBg || 'bg-slate-400'
                        } text-white flex items-center justify-center text-[10px] font-bold`}
                      >
                        {idea.author[0]}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {idea.author}
                      </span>
                    </div>
                  </div>

                  {/* Title & Content */}
                  <h3 className={`text-base font-bold mb-2 break-words break-all ${style.text}`}>
                    {idea.title}
                  </h3>
                  {idea.content && (
                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words break-all mb-4">
                      {renderFormattedContent(idea.content)}
                    </div>
                  )}
                </div>

                {/* Footer: Voters & Action Buttons */}
                <div className="pt-3 border-t border-slate-900/10 flex items-center justify-between gap-2 min-w-0">
                  {/* Voter Avatars */}
                  <div className="flex items-center space-x-1 min-w-0 overflow-hidden">
                    <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                      {votes.map((voter) => {
                        const voterInfo = WORKSHOP_MEMBERS.find((m) => m.name === voter);
                        return (
                          <div
                            key={voter}
                            className={`inline-block h-5 w-5 rounded-full ring-2 ring-white ${
                              voterInfo?.avatarBg || 'bg-slate-400'
                            } text-white text-[9px] font-bold flex items-center justify-center`}
                            title={`${voter}님이 공감함`}
                          >
                            {voter[0]}
                          </div>
                        );
                      })}
                    </div>
                    {votes.length > 0 && (
                      <span className="text-[11px] text-slate-500 font-semibold ml-1 shrink-0">
                        {votes.length}명
                      </span>
                    )}
                  </div>

                  {/* Action Buttons: Vote, Edit, Delete */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => voteIdea(idea.id, currentUser)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        hasVoted
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${hasVoted ? 'fill-white' : ''}`} />
                      <span>{hasVoted ? '공감됨' : '공감'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(idea)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition opacity-70 group-hover:opacity-100"
                      title="수정하기"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => deleteIdea(idea.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition opacity-60 group-hover:opacity-100"
                      title="삭제하기"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Idea Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>{editingIdea ? '아이디어 수정하기' : '새로운 아이디어 올리기'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  아이디어 제목 *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 저녁 먹고 밤샘 밸런스 게임 & 보드게임 대항전!"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  카테고리
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="팀빌딩 활동">팀빌딩 활동</option>
                  <option value="저녁 프로그램">저녁 프로그램</option>
                  <option value="준비물/참고">준비물/참고</option>
                  <option value="기타 아이디어">기타 아이디어</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  상세 설명
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="구체적인 규칙이나 링크, 진행 방식 등을 적어주세요..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ※ 링크(http/https) 입력 시 깔끔하게 축약된 바로가기 버튼으로 자동 변환됩니다.
                </p>
              </div>

              {/* Color selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  카드 색상 선택
                </label>
                <div className="flex space-x-3">
                  {(['yellow', 'pink', 'blue', 'green', 'purple'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        c === 'yellow'
                          ? 'bg-amber-300'
                          : c === 'pink'
                          ? 'bg-rose-300'
                          : c === 'blue'
                          ? 'bg-sky-300'
                          : c === 'green'
                          ? 'bg-emerald-300'
                          : 'bg-purple-300'
                      } ${color === c ? 'ring-2 ring-slate-900 scale-110 shadow-xs' : 'hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  {editingIdea ? '수정 완료' : '올리기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
