import { StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LiquorItem } from '@/components/LiquorItem';
import { useState } from 'react';

export default function HomeScreen() {
  // 임시 데이터
  const [liquors] = useState([
    { id: 1, name: '글렌피딕 12년', type: '위스키', rating: 4.5 },
    { id: 2, name: '참이슬 후레쉬', type: '소주', rating: 3.8 },
    { id: 3, name: '장수 생막걸리', type: '막걸리', rating: 4.2 },
  ]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <ThemedText type="title">우리들의 술평가</ThemedText>
        <ThemedText style={styles.subtitle}>주당들의 솔직한 리뷰</ThemedText>
        
        <ThemedView style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="위스키 검색..."
          />
          <TouchableOpacity style={styles.addButton}>
            <ThemedText style={styles.buttonText}>추가</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.listContainer}>
          {liquors.map(liquor => (
            <LiquorItem
              key={liquor.id}
              name={liquor.name}
              type={liquor.type}
              rating={liquor.rating}
              onPress={() => console.log('Pressed:', liquor.name)}
            />
          ))}
        </ThemedView>
      </ScrollView>
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
});