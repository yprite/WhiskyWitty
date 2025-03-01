import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Image, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function LiquorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // 실제 앱에서는 ID를 기반으로 데이터를 가져와야 합니다
  const liquor = tempData.find(item => item.id === id);

  if (!liquor) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>주류를 찾을 수 없습니다.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.imageContainer}>
        {liquor.imageUrl ? (
          <Image
            source={{ uri: liquor.imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <IconSymbol
            size={80}
            name="photo"
            color="#808080"
          />
        )}
      </ThemedView>

      <ThemedView style={styles.infoContainer}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.name}>
            {liquor.name}
          </ThemedText>
          <ThemedText style={styles.brand}>{liquor.brand}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.detailsContainer}>
          <DetailItem label="종류" value={liquor.type} />
          <DetailItem label="원산지" value={liquor.country} />
          <DetailItem label="도수" value={`${liquor.abv}%`} />
          <DetailItem label="용량" value={`${liquor.volume}ml`} />
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const DetailItem = ({ label, value }: { label: string; value?: string }) => (
  <ThemedView style={styles.detailItem}>
    <ThemedText style={styles.label}>{label}</ThemedText>
    <ThemedText style={styles.value}>{value || '-'}</ThemedText>
  </ThemedView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    marginBottom: 4,
  },
  brand: {
    fontSize: 16,
    opacity: 0.7,
  },
  detailsContainer: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  label: {
    fontSize: 16,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
  },
}); 