import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LiquorItem } from '@/components/LiquorItem';
import { LiquorDetailModal } from '@/components/LiquorDetailModal';
import { AddLiquorModal } from '@/components/AddLiquorModal';
import { useState, useCallback, useEffect } from 'react';
import { liquorAPI } from '@/services/api';
import { Liquor } from '@/types/liquor';

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedLiquor, setSelectedLiquor] = useState<typeof liquors[0] | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [liquors, setLiquors] = useState<Liquor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 주류 목록 로딩
  useEffect(() => {
    loadLiquors();
  }, []);

  const loadLiquors = async () => {
    try {
      setIsLoading(true);
      const response = await liquorAPI.getAll();
      setLiquors(response.data);
    } catch (err) {
      setError('주류 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어로 필터링된 데이터
  const filteredLiquors = useCallback(() => {
    if (!searchText) return liquors;
    return liquors.filter(liquor => 
      liquor.name.toLowerCase().includes(searchText.toLowerCase()) ||
      liquor.type.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [liquors, searchText]);

  const handleLiquorPress = (liquor: typeof liquors[0]) => {
    setSelectedLiquor(liquor);
    setModalVisible(true);
  };

  // 주류 추가
  const handleAddLiquor = async (newLiquor: Omit<Liquor, 'id' | 'rating'>) => {
    try {
      const response = await liquorAPI.create(newLiquor);
      setLiquors(prev => [...prev, response.data]);
      setAddModalVisible(false);
    } catch (err) {
      alert('주류 추가에 실패했습니다.');
      console.error(err);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0d6efd" />
      ) : error ? (
        <ThemedText style={styles.error}>{error}</ThemedText>
      ) : (
        <ScrollView>
          <ThemedText type="title">우리들의 술평가</ThemedText>
          <ThemedText style={styles.subtitle}>주당들의 솔직한 리뷰</ThemedText>
          
          <ThemedView style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="술 이름이나 종류로 검색..."
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setAddModalVisible(true)}
            >
              <ThemedText style={styles.buttonText}>추가</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.listContainer}>
            {filteredLiquors().map(liquor => (
              <LiquorItem
                key={liquor.id}
                name={liquor.name}
                type={liquor.type}
                rating={liquor.rating}
                onPress={() => handleLiquorPress(liquor)}
              />
            ))}
          </ThemedView>
        </ScrollView>
      )}

      <AddLiquorModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddLiquor}
      />
      
      <LiquorDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        liquor={selectedLiquor}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    color: '#666',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#0d6efd',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
  },
  listContainer: {
    flex: 1,
  },
  error: {
    color: 'red',
    marginTop: 20,
    textAlign: 'center',
  },
});