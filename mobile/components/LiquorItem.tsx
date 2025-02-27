import { StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type LiquorItemProps = {
  name: string;
  type: string;
  rating: number;
  image?: string;
  onPress: () => void;
};

export function LiquorItem({ name, type, rating, image, onPress }: LiquorItemProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedView style={styles.container}>
        <Image
          source={image ? { uri: image } : require('@/assets/images/default-liquor.png')}
          style={styles.image}
        />
        <ThemedView style={styles.info}>
          <ThemedText type="defaultSemiBold">{name}</ThemedText>
          <ThemedView style={styles.typeContainer}>
            <ThemedText style={styles.type}>{type}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.rating}>
            <ThemedText>★ {rating.toFixed(1)}</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  typeContainer: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  type: {
    fontSize: 12,
    color: '#495057',
  },
  rating: {
    marginTop: 4,
  },
}); 