import { Modal, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState, useMemo } from 'react';
import React from 'react';
import { Colors } from '@/constants/Colors';
import { liquorAPI } from '@/services/api';

type Review = {
  id: number;
  text: string;
  rating: number;
  author: string;
  date: string;
  likes: number;
  isLiked?: boolean;
};

type LiquorDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  liquor?: {
    name: string;
    type: string;
    rating: number;
    reviews?: Review[];
    description?: string;
    price?: {
      average: number;
      min: number;
      max: number;
    };
    details?: {
      alcohol?: string;
      volume?: string;
      manufacturer?: string;
      origin?: string;
    };
    profile?: {
      smoothness: number;
      aroma: number;
      complexity: number;
      finish: number;
      balance: number;
      intensity: number;
    };
  };
};

type SortOption = 'latest' | 'likes';

function StarRating({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <ThemedView style={styles.starContainer}>
      {stars.map((star) => (
        <Pressable
          key={star}
          onPress={() => onRatingChange(star)}
          style={({ pressed }) => [
            styles.starButton,
            pressed && styles.starButtonPressed
          ]}
        >
          <ThemedText style={[
            styles.star,
            star <= rating && styles.starFilled
          ]}>
            ★
          </ThemedText>
        </Pressable>
      ))}
      <ThemedText style={styles.ratingText}>
        {rating.toFixed(1)}
      </ThemedText>
    </ThemedView>
  );
}

export function LiquorDetailModal({ visible, onClose, liquor }: LiquorDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [newReview, setNewReview] = useState('');
  const [editingReview, setEditingReview] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [reviews, setReviews] = useState<Review[]>([
    { id: 1, text: "부드럽고 깔끔한 맛", rating: 4.5, author: "user1", date: "2024-02-20", likes: 5, isLiked: false },
    { id: 2, text: "가성비가 좋아요", rating: 4.0, author: "user2", date: "2024-02-19", likes: 3, isLiked: true },
    { id: 3, text: "향이 독특해요", rating: 3.5, author: "user3", date: "2024-02-18", likes: 111, isLiked: false },
  ]);
  const [newReviewRating, setNewReviewRating] = useState(5.0);
  const [reviewInputHeight, setReviewInputHeight] = useState(40);

  const handleLike = (reviewId: number) => {
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId) {
        const newIsLiked = !review.isLiked;
        return {
          ...review,
          isLiked: newIsLiked,
          likes: review.likes + (newIsLiked ? 1 : -1)
        };
      }
      return review;
    }));
  };

  const handleSubmitReview = async () => {
    if (!newReview.trim() || !liquor) return;

    try {
      const response = await liquorAPI.addReview(liquor.id, {
        text: newReview.trim(),
        rating: newReviewRating,
      });
      
      setLiquor(response.data);
      setNewReview('');
      setNewReviewRating(5.0);
    } catch (err) {
      alert('리뷰 작성에 실패했습니다.');
      console.error(err);
    }
  };

  const handleDelete = (reviewId: number) => {
    Alert.alert(
      "리뷰 삭제",
      "이 리뷰를 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive",
          onPress: () => {
            setReviews(prev => prev.filter(review => review.id !== reviewId));
          }
        }
      ]
    );
  };

  const handleEditStart = (review: Review) => {
    setEditingReview(review.id);
    setEditText(review.text);
  };

  const handleEditComplete = () => {
    if (!editText.trim()) return;

    setReviews(prev => prev.map(review => {
      if (review.id === editingReview) {
        return {
          ...review,
          text: editText.trim(),
        };
      }
      return review;
    }));
    
    setEditingReview(null);
    setEditText('');
  };

  const handleEditCancel = () => {
    setEditingReview(null);
    setEditText('');
  };

  // 정렬된 리뷰 목록 반환
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (sortOption === 'latest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return b.likes - a.likes;
      }
    });
  }, [reviews, sortOption]);

  const renderDetailSection = (title: string, content: React.ReactNode) => (
    <ThemedView style={styles.detailSection}>
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{title}</ThemedText>
      {content}
    </ThemedView>
  );

  if (!liquor) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.centeredView, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <ThemedView style={[styles.modalView, { backgroundColor: Colors.light.background }]}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">{liquor.name}</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <ThemedText style={styles.closeButton}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'info' && styles.activeTab]}
              onPress={() => setActiveTab('info')}
            >
              <ThemedText style={activeTab === 'info' ? styles.activeTabText : styles.tabText}>
                상세정보
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
              onPress={() => setActiveTab('reviews')}
            >
              <ThemedText style={activeTab === 'reviews' ? styles.activeTabText : styles.tabText}>
                리뷰
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.content}>
            {activeTab === 'info' ? (
              <ThemedView style={styles.infoContainer}>
                {liquor.description && renderDetailSection(
                  "제품 설명",
                  <ThemedText style={styles.description}>{liquor.description}</ThemedText>
                )}

                {renderDetailSection(
                  "기본 정보",
                  <ThemedView style={styles.basicInfo}>
                    <ThemedView style={styles.infoRow}>
                      <ThemedText type="defaultSemiBold">종류:</ThemedText>
                      <ThemedText>{liquor.type}</ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.infoRow}>
                      <ThemedText type="defaultSemiBold">평점:</ThemedText>
                      <ThemedText>★ {liquor.rating.toFixed(1)}</ThemedText>
                    </ThemedView>
                    {liquor.details?.alcohol && (
                      <ThemedView style={styles.infoRow}>
                        <ThemedText type="defaultSemiBold">도수:</ThemedText>
                        <ThemedText>{liquor.details.alcohol}</ThemedText>
                      </ThemedView>
                    )}
                    {liquor.details?.volume && (
                      <ThemedView style={styles.infoRow}>
                        <ThemedText type="defaultSemiBold">용량:</ThemedText>
                        <ThemedText>{liquor.details.volume}</ThemedText>
                      </ThemedView>
                    )}
                    {liquor.details?.manufacturer && (
                      <ThemedView style={styles.infoRow}>
                        <ThemedText type="defaultSemiBold">제조사:</ThemedText>
                        <ThemedText>{liquor.details.manufacturer}</ThemedText>
                      </ThemedView>
                    )}
                    {liquor.details?.origin && (
                      <ThemedView style={styles.infoRow}>
                        <ThemedText type="defaultSemiBold">원산지:</ThemedText>
                        <ThemedText>{liquor.details.origin}</ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                )}

                {liquor.price && renderDetailSection(
                  "가격 정보",
                  <ThemedView style={styles.priceInfo}>
                    <ThemedView style={styles.infoRow}>
                      <ThemedText type="defaultSemiBold">평균가:</ThemedText>
                      <ThemedText>{liquor.price.average.toLocaleString()}원</ThemedText>
                    </ThemedView>
                    <ThemedText style={styles.priceRange}>
                      최저 {liquor.price.min.toLocaleString()}원 ~ 최고 {liquor.price.max.toLocaleString()}원
                    </ThemedText>
                  </ThemedView>
                )}

                {liquor.profile && renderDetailSection(
                  "맛 프로필",
                  <ThemedView style={styles.profile}>
                    {Object.entries(liquor.profile).map(([key, value]) => (
                      <ThemedView key={key} style={styles.profileItem}>
                        <ThemedText>{key.charAt(0).toUpperCase() + key.slice(1)}</ThemedText>
                        <ThemedView style={styles.profileBar}>
                          <ThemedView 
                            style={[styles.profileFill, { width: `${(value / 5) * 100}%` }]} 
                          />
                        </ThemedView>
                        <ThemedText>{value.toFixed(1)}</ThemedText>
                      </ThemedView>
                    ))}
                  </ThemedView>
                )}
              </ThemedView>
            ) : (
              <ThemedView style={styles.reviewsContainer}>
                <ThemedView style={styles.reviewHeader}>
                  <ThemedText type="defaultSemiBold">리뷰 {reviews.length}개</ThemedText>
                  <ThemedView style={styles.sortButtons}>
                    <TouchableOpacity 
                      style={[
                        styles.sortButton,
                        sortOption === 'latest' && styles.activeSortButton
                      ]}
                      onPress={() => setSortOption('latest')}
                    >
                      <ThemedText style={[
                        styles.sortButtonText,
                        sortOption === 'latest' && styles.activeSortButtonText
                      ]}>
                        최신순
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.sortButton,
                        sortOption === 'likes' && styles.activeSortButton
                      ]}
                      onPress={() => setSortOption('likes')}
                    >
                      <ThemedText style={[
                        styles.sortButtonText,
                        sortOption === 'likes' && styles.activeSortButtonText
                      ]}>
                        인기순
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.reviewInputContainer}>
                  <StarRating
                    rating={newReviewRating}
                    onRatingChange={setNewReviewRating}
                  />
                  <ThemedView style={styles.reviewInputRow}>
                    <TextInput
                      style={[styles.reviewInput, { height: Math.max(40, reviewInputHeight) }]}
                      value={newReview}
                      onChangeText={setNewReview}
                      placeholder="리뷰를 작성해주세요"
                      multiline
                      onContentSizeChange={(e) => 
                        setReviewInputHeight(e.nativeEvent.contentSize.height)
                      }
                    />
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleSubmitReview}
                    >
                      <ThemedText style={styles.submitButtonText}>작성</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>

                {sortedReviews.map(review => (
                  <ThemedView key={review.id} style={styles.reviewItem}>
                    <ThemedView style={styles.reviewHeader}>
                      <ThemedText type="defaultSemiBold">{review.author}</ThemedText>
                      <ThemedView style={styles.reviewActions}>
                        <ThemedText style={styles.reviewDate}>{review.date}</ThemedText>
                        <TouchableOpacity onPress={() => handleEditStart(review)}>
                          <ThemedText style={styles.actionButton}>수정</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(review.id)}>
                          <ThemedText style={[styles.actionButton, styles.deleteButton]}>삭제</ThemedText>
                        </TouchableOpacity>
                      </ThemedView>
                    </ThemedView>
                    
                    {editingReview === review.id ? (
                      <ThemedView style={styles.editContainer}>
                        <TextInput
                          style={styles.editInput}
                          value={editText}
                          onChangeText={setEditText}
                          multiline
                        />
                        <ThemedView style={styles.editActions}>
                          <TouchableOpacity 
                            style={[styles.editButton, styles.cancelButton]}
                            onPress={handleEditCancel}
                          >
                            <ThemedText style={styles.editButtonText}>취소</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={handleEditComplete}
                          >
                            <ThemedText style={styles.editButtonText}>완료</ThemedText>
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>
                    ) : (
                      <>
                        <ThemedText>★ {review.rating.toFixed(1)}</ThemedText>
                        <ThemedText style={styles.reviewText}>{review.text}</ThemedText>
                      </>
                    )}

                    <ThemedView style={styles.reviewFooter}>
                      <TouchableOpacity 
                        style={styles.likeButton} 
                        onPress={() => handleLike(review.id)}
                      >
                        <ThemedText style={[
                          styles.likeIcon, 
                          review.isLiked && styles.likedIcon
                        ]}>
                          ♥
                        </ThemedText>
                        <ThemedText style={styles.likeCount}>{review.likes}</ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  </ThemedView>
                ))}
              </ThemedView>
            )}
          </ScrollView>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 24,
    padding: 5,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0d6efd',
  },
  tabText: {
    color: '#666',
  },
  activeTabText: {
    color: '#0d6efd',
    fontWeight: '600',
  },
  content: {
    maxHeight: 400,
  },
  infoContainer: {
    gap: 24,
  },
  detailSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  description: {
    lineHeight: 20,
  },
  basicInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  priceInfo: {
    gap: 4,
  },
  priceRange: {
    color: '#666',
    fontSize: 14,
  },
  profile: {
    gap: 12,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  profileFill: {
    height: '100%',
    backgroundColor: '#0d6efd',
    borderRadius: 4,
  },
  reviewsContainer: {
    gap: 15,
  },
  reviewItem: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 5,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewText: {
    marginTop: 5,
  },
  reviewInputContainer: {
    gap: 10,
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  reviewInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  reviewInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  likeIcon: {
    fontSize: 16,
    color: '#666',
  },
  likedIcon: {
    color: '#ff4081',
  },
  likeCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    fontSize: 12,
    color: '#0d6efd',
    padding: 4,
  },
  deleteButton: {
    color: '#dc3545',
  },
  editContainer: {
    gap: 8,
    marginTop: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    minHeight: 60,
    backgroundColor: 'white',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
  },
  activeSortButton: {
    backgroundColor: '#e7f1ff',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeSortButtonText: {
    color: '#0d6efd',
    fontWeight: '600',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  starButtonPressed: {
    opacity: 0.7,
  },
  star: {
    fontSize: 24,
    color: '#ddd',
  },
  starFilled: {
    color: '#ffd700',
  },
  ratingText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
}); 