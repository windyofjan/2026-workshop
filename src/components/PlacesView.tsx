import React, { useState } from 'react';
import {
  MapPin,
  ExternalLink,
  ThumbsUp,
  Plus,
  Trash2,
  Utensils,
  Coffee,
  Compass,
  Building,
  Search,
  Filter,
  Pencil,
  Globe,
  Copy,
  Check,
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { PlaceItem } from '../types';

export const PlacesView: React.FC = () => {
  const { places, addPlace, updatePlace, votePlace, deletePlace, currentUser } = useWorkshop();

  const KAKAO_MAP_COLLECTION_URL = 'https://kko.to/01D_G-TWZx';
  const [copiedLink, setCopiedLink] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceItem | null>(null);

  // Region, Category & Search Filters
  const [filterRegion, setFilterRegion] = useState<string>('전체');
  const [filterCategory, setFilterCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceItem['category']>('맛집');
  const [region, setRegion] = useState<string>('강릉');
  const [recommendedBy, setRecommendedBy] = useState<string>(currentUser);
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [notes, setNotes] = useState('');

  const regions = [
    { label: '전체', value: '전체' },
    { label: '🌊 강릉', value: '강릉' },
    { label: '🌅 동해', value: '동해' },
    { label: '🏖️ 삼척', value: '삼척' },
    { label: '📍 기타', value: '기타' },
  ];

  const categories = ['전체', '맛집', '카페', '가볼만한 곳', '숙소'];

  const getCategoryIcon = (cat: PlaceItem['category']) => {
    switch (cat) {
      case '맛집':
        return <Utensils className="w-3.5 h-3.5 text-amber-500" />;
      case '카페':
        return <Coffee className="w-3.5 h-3.5 text-rose-500" />;
      case '가볼만한 곳':
        return <Compass className="w-3.5 h-3.5 text-emerald-500" />;
      case '숙소':
        return <Building className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const getCategoryBadge = (cat: PlaceItem['category']) => {
    switch (cat) {
      case '맛집':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case '카페':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case '가볼만한 곳':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '숙소':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const getRegionTheme = (r?: string) => {
    switch (r) {
      case '강릉':
        return {
          cardBg: 'bg-gradient-to-br from-blue-50/90 to-sky-50/60 border-blue-200 hover:border-blue-300',
          badgeBg: 'bg-blue-600 text-white border-blue-700',
          badgeText: '🌊 강릉',
          accentColor: 'text-blue-900',
        };
      case '동해':
        return {
          cardBg: 'bg-gradient-to-br from-teal-50/90 to-emerald-50/60 border-teal-200 hover:border-teal-300',
          badgeBg: 'bg-teal-600 text-white border-teal-700',
          badgeText: '🌅 동해',
          accentColor: 'text-teal-900',
        };
      case '삼척':
        return {
          cardBg: 'bg-gradient-to-br from-amber-50/90 to-orange-50/60 border-amber-200 hover:border-amber-300',
          badgeBg: 'bg-amber-600 text-white border-amber-700',
          badgeText: '🏖️ 삼척',
          accentColor: 'text-amber-900',
        };
      default:
        return {
          cardBg: 'bg-gradient-to-br from-slate-50 to-indigo-50/40 border-slate-200 hover:border-slate-300',
          badgeBg: 'bg-indigo-600 text-white border-indigo-700',
          badgeText: '📍 기타',
          accentColor: 'text-slate-900',
        };
    }
  };

  const openNewModal = () => {
    setEditingPlace(null);
    setName('');
    setCategory('맛집');
    setRegion('강릉');
    setRecommendedBy(currentUser);
    setAddress('');
    setMapUrl('');
    setNotes('');
    setShowAddModal(true);
  };

  const openEditModal = (place: PlaceItem) => {
    setEditingPlace(place);
    setName(place.name);
    setCategory(place.category);
    setRegion(place.region || '강릉');
    setRecommendedBy(place.recommendedBy || currentUser);
    setAddress(place.address || '');
    setMapUrl(place.mapUrl || '');
    setNotes(place.notes || '');
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalMapUrl =
      mapUrl.trim() ||
      `https://map.naver.com/v5/search/${encodeURIComponent(name.trim())}`;

    if (editingPlace) {
      await updatePlace(editingPlace.id, {
        name: name.trim(),
        category,
        region,
        recommendedBy: recommendedBy || currentUser,
        address: address.trim(),
        mapUrl: finalMapUrl,
        notes: notes.trim(),
      });
    } else {
      await addPlace({
        name: name.trim(),
        category,
        region,
        recommendedBy: recommendedBy || currentUser,
        address: address.trim(),
        mapUrl: finalMapUrl,
        notes: notes.trim(),
        votes: [currentUser],
        rating: 5,
        createdAt: new Date().toISOString(),
      });
    }

    setName('');
    setAddress('');
    setMapUrl('');
    setNotes('');
    setEditingPlace(null);
    setShowAddModal(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(KAKAO_MAP_COLLECTION_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredPlaces = places.filter((p) => {
    const matchRegion = filterRegion === '전체' || p.region === filterRegion;
    const matchCat = filterCategory === '전체' || p.category === filterCategory;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchRegion && matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & New Place Button */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>📍 추천 장소 목록</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
              총 {places.length}곳
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            강릉, 동해, 삼척 권역별 맛집, 카페, 숙소, 가볼만한 곳을 등록하고 확인해 보세요!
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>장소 추천하기</span>
        </button>
      </div>

      {/* KakaoMap Saved List Banner */}
      <div className="bg-gradient-to-br from-amber-50/90 via-yellow-50/50 to-emerald-50/40 rounded-2xl p-5 border border-amber-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEE500] text-[#191919] border border-amber-300/80 flex items-center justify-center font-extrabold text-base shadow-2xs shrink-0">
              K
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>🗺️ 카카오맵 워크숍 저장 목록</span>
                </h3>
                <span className="text-[10px] bg-amber-500 text-slate-900 px-2 py-0.5 rounded-md font-bold shadow-2xs">
                  저장 리스트
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                추천된 장소들이 한 번에 모여있는 카카오맵 저장 목록입니다.{' '}
                <a
                  href={KAKAO_MAP_COLLECTION_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-800 font-semibold underline underline-offset-2 hover:text-amber-900 break-all"
                >
                  {KAKAO_MAP_COLLECTION_URL}
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center space-x-1 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition"
              title="링크 주소 복사"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-700 font-bold">복사됨!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>링크 복사</span>
                </>
              )}
            </button>

            <a
              href={KAKAO_MAP_COLLECTION_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] border border-amber-300 text-xs font-bold rounded-xl shadow-xs transition"
            >
              <span>카카오맵 바로가기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Region Filters ("지역별 카테고리") */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center space-x-1 mr-1">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>지역:</span>
            </span>
            {regions.map((r) => (
              <button
                key={r.value}
                onClick={() => setFilterRegion(r.value)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  filterRegion === r.value
                    ? r.value === '강릉'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : r.value === '동해'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : r.value === '삼척'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="장소명, 메뉴, 주소 검색..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
          <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center space-x-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>구분:</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterCategory === cat
                  ? 'bg-slate-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Places Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlaces.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200">
            <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500">
              해당 조건의 장소가 없습니다.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              상단의 '장소 추천하기' 버튼을 눌러 맛집이나 숙소를 추가해 보세요!
            </p>
          </div>
        ) : (
          filteredPlaces.map((place) => {
            const votes = place.votes || [];
            const hasVoted = votes.includes(currentUser);
            const theme = getRegionTheme(place.region);

            return (
              <div
                key={place.id}
                className={`group rounded-2xl p-5 border transition duration-200 flex flex-col justify-between relative hover:shadow-md ${theme.cardBg}`}
              >
                <div>
                  {/* Region & Category Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md shadow-2xs font-bold ${theme.badgeBg}`}>
                        {theme.badgeText}
                      </span>

                      <span
                        className={`flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadge(
                          place.category
                        )}`}
                      >
                        {getCategoryIcon(place.category)}
                        <span>{place.category}</span>
                      </span>
                    </div>
                  </div>

                  {/* Name & Naver Map Action */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={`text-base font-bold ${theme.accentColor}`}>
                      {place.name}
                    </h3>

                    {place.mapUrl && (
                      <a
                        href={place.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1 px-2.5 py-1 bg-white/90 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[11px] font-bold rounded-xl border border-slate-200 transition shadow-2xs shrink-0"
                        title="네이버 지도에서 위치 보기"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>지도보기</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    )}
                  </div>

                  {/* Address */}
                  {place.address && (
                    <p className="text-xs text-slate-600 mb-2.5 flex items-center space-x-1 font-medium">
                      <span>📍 {place.address}</span>
                    </p>
                  )}

                  {/* Notes / Recommendation reasons */}
                  {place.notes && (
                    <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed mb-4">
                      💡 {place.notes}
                    </p>
                  )}
                </div>

                {/* Footer: Voters & Actions */}
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-500 font-medium mr-1">
                      추천: <strong>{place.recommendedBy}</strong>
                    </span>
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {votes.map((voter) => (
                        <div
                          key={voter}
                          className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center"
                          title={`${voter}님이 가고싶어함`}
                        >
                          {voter[0]}
                        </div>
                      ))}
                    </div>
                    {votes.length > 0 && (
                      <span className="text-[11px] text-slate-600 font-semibold ml-1">
                        {votes.length}표
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => votePlace(place.id, currentUser)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        hasVoted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${hasVoted ? 'fill-white' : ''}`} />
                      <span>{hasVoted ? '여기 가요!' : '가고싶어요'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(place)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition"
                      title="정보 수정"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deletePlace(place.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                      title="삭제"
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

      {/* Add / Edit Place Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Utensils className="w-5 h-5 text-emerald-600" />
              <span>
                {editingPlace ? '✏️ 장소 정보 수정' : '✨ 새 추천 장소 등록'}
              </span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  지역 선택 *
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['강릉', '동해', '삼척', '기타'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegion(r)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition text-center ${
                        region === r
                          ? r === '강릉'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : r === '동해'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : r === '삼척'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {r === '강릉' ? '🌊 강릉' : r === '동해' ? '🌅 동해' : r === '삼척' ? '🏖️ 삼척' : '📍 기타'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  장소 이름 *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 강릉 초당순두부 마을, 동해 촛대바위, 삼척 쏠비치"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  주소 (선택)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="예: 강원 강릉시 초당순두부길 77"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    구분
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    <option value="맛집">맛집</option>
                    <option value="카페">카페</option>
                    <option value="가볼만한 곳">가볼만한 곳</option>
                    <option value="숙소">숙소</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    추천한 사람
                  </label>
                  <select
                    value={recommendedBy}
                    onChange={(e) => setRecommendedBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    {['유옥', '현정', '권웅', '신혜', '다온'].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  네이버 지도 / 카카오 지도 링크 (예: https://naver.me/xuchnkpo)
                </label>
                <input
                  type="url"
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  placeholder="https://naver.me/xuchnkpo"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  추천 이유 / 주메뉴 / 특징
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="추천하는 대표 메뉴나 주차 정보, 특이사항 등을 적어주세요..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPlace(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  {editingPlace ? '수정 완료' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
