import { StyleSheet, FlatList, Dimensions, Image, ActivityIndicator, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Liquor 타입에 이미지 URL 추가
type Liquor = {
  id: string;
  name: string;
  type: string;
  abv: number;
  volume: number;
  brand?: string;
  country?: string;
  imageUrl?: string;
};

// 임시 데이터 업데이트 - 실제 이미지 URL 추가
const tempData: Liquor[] = [
  {
    id: '1',
    name: '발렌타인 17년산',
    type: '위스키',
    brand: 'Ballantine\'s',
    country: '스코틀랜드',
    abv: 40,
    volume: 700,
    imageUrl: 'https://www.thewhiskyexchange.com/media/catalog/product/b/a/ballantines-17-year-old_1.jpg',
  },
  {
    id: '2',
    name: '산토리 야마자키',
    type: '위스키',
    brand: 'Suntory',
    country: '일본',
    abv: 43,
    volume: 700,
    imageUrl: 'https://www.thewhiskyexchange.com/media/catalog/product/y/a/yamazaki-12-year-old_1.jpg',
  },
];

type ImageLoadingState = 'loading' | 'success' | 'error';

// 캐시 메타데이터 타입 정의
type CacheMetadata = {
  timestamp: number;
  filePath: string;
};

// 캐시 설정
const CACHE_CONFIG = {
  EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7일
  METADATA_FILE: 'metadata.json',
};

// 이미지 캐싱을 위한 유틸리티 함수들
const IMAGE_CACHE_FOLDER = `${FileSystem.cacheDirectory}images/`;
const METADATA_PATH = `${IMAGE_CACHE_FOLDER}${CACHE_CONFIG.METADATA_FILE}`;

// 메타데이터 관리 함수들
const loadMetadata = async (): Promise<Record<string, CacheMetadata>> => {
  try {
    const exists = await FileSystem.getInfoAsync(METADATA_PATH);
    if (!exists.exists) {
      return {};
    }
    const data = await FileSystem.readAsStringAsync(METADATA_PATH);
    return JSON.parse(data);
  } catch (error) {
    console.warn('Failed to load cache metadata:', error);
    return {};
  }
};

const saveMetadata = async (metadata: Record<string, CacheMetadata>) => {
  try {
    await FileSystem.writeAsStringAsync(
      METADATA_PATH,
      JSON.stringify(metadata)
    );
  } catch (error) {
    console.warn('Failed to save cache metadata:', error);
  }
};

const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_FOLDER);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_FOLDER, { intermediates: true });
  }
};

const cleanExpiredCache = async () => {
  try {
    const metadata = await loadMetadata();
    const now = Date.now();
    let hasExpired = false;

    // 만료된 캐시 항목 찾기
    for (const [key, data] of Object.entries(metadata)) {
      if (now - data.timestamp > CACHE_CONFIG.EXPIRY_MS) {
        try {
          await FileSystem.deleteAsync(data.filePath);
          delete metadata[key];
          hasExpired = true;
        } catch (error) {
          console.warn(`Failed to delete expired cache file: ${data.filePath}`, error);
        }
      }
    }

    // 메타데이터가 변경되었다면 저장
    if (hasExpired) {
      await saveMetadata(metadata);
    }
  } catch (error) {
    console.warn('Failed to clean expired cache:', error);
  }
};

const getCachedImage = async (url: string) => {
  try {
    await ensureDirExists();
    
    // 주기적으로 만료된 캐시 정리
    await cleanExpiredCache();
    
    // 메타데이터 로드
    const metadata = await loadMetadata();
    
    // URL을 해시화하여 파일 이름으로 사용
    const filename = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      url
    );
    const filePath = IMAGE_CACHE_FOLDER + filename;
    
    // 캐시 확인
    const cached = metadata[url];
    const now = Date.now();
    
    if (cached) {
      // 캐시가 만료되었는지 확인
      if (now - cached.timestamp > CACHE_CONFIG.EXPIRY_MS) {
        // 만료된 캐시 삭제
        await FileSystem.deleteAsync(cached.filePath);
        delete metadata[url];
      } else {
        // 유효한 캐시 반환
        const fileInfo = await FileSystem.getInfoAsync(cached.filePath);
        if (fileInfo.exists) {
          return `file://${cached.filePath}`;
        }
      }
    }
    
    // 새로운 파일 다운로드
    await FileSystem.downloadAsync(url, filePath);
    
    // 메타데이터 업데이트
    metadata[url] = {
      timestamp: now,
      filePath,
    };
    await saveMetadata(metadata);
    
    return `file://${filePath}`;
  } catch (error) {
    console.warn('Image caching error:', error);
    return url; // 캐싱 실패시 원본 URL 반환
  }
};

// LiquorImage 컴포넌트 수정
const LiquorImage = ({ 
  imageUrl, 
  onLoadStart, 
  onLoadSuccess, 
  onLoadError 
}: { 
  imageUrl: string;
  onLoadStart: () => void;
  onLoadSuccess: () => void;
  onLoadError: () => void;
}) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        onLoadStart();
        const cached = await getCachedImage(imageUrl);
        setCachedUrl(cached);
        onLoadSuccess();
      } catch (error) {
        console.error('Error loading image:', error);
        onLoadError();
      }
    };

    loadImage();
  }, [imageUrl]);

  if (!cachedUrl) {
    return null;
  }

  return (
    <Image
      source={{ uri: cachedUrl }}
      style={styles.image}
      resizeMode="cover"
      onError={onLoadError}
    />
  );
};

// LiquorItem 컴포넌트를 분리
const LiquorItem = ({ item }: { item: Liquor }) => {
  const router = useRouter();
  const [imageState, setImageState] = useState<ImageLoadingState>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY = 3;

  const handleRetry = () => {
    if (retryCount < MAX_RETRY) {
      setImageState('loading');
      setRetryCount(prev => prev + 1);
    }
  };

  const handlePress = () => {
    router.push(`/liquor/${item.id}`);
  };

  const renderImageContent = () => {
    if (!item.imageUrl) {
      return (
        <ThemedView style={styles.fallbackContainer}>
          <IconSymbol
            size={40}
            name="photo"
            color="#808080"
          />
          <ThemedText style={styles.fallbackText}>이미지 없음</ThemedText>
        </ThemedView>
      );
    }

    return (
      <>
        {imageState === 'success' && (
          <LiquorImage
            imageUrl={item.imageUrl}
            onLoadStart={() => setImageState('loading')}
            onLoadSuccess={() => setImageState('success')}
            onLoadError={() => setImageState('error')}
          />
        )}
        
        {imageState === 'loading' && (
          <ThemedView style={styles.imageStateContainer}>
            <ActivityIndicator size="small" />
            <ThemedText style={styles.loadingText}>로딩 중...</ThemedText>
          </ThemedView>
        )}

        {imageState === 'error' && (
          <ThemedView style={styles.imageStateContainer}>
            <IconSymbol
              size={24}
              name="exclamationmark.triangle"
              color="#808080"
            />
            <ThemedText style={styles.errorText}>이미지 로드 실패</ThemedText>
            {retryCount < MAX_RETRY && (
              <ThemedText 
                style={styles.retryButton}
                onPress={handleRetry}
              >
                다시 시도 ({MAX_RETRY - retryCount}회 남음)
              </ThemedText>
            )}
          </ThemedView>
        )}
      </>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.itemContainer,
        pressed && styles.itemPressed,
      ]}
      onPress={handlePress}
    >
      <ThemedView style={styles.imageContainer}>
        {renderImageContent()}
      </ThemedView>
      <ThemedView style={styles.contentContainer}>
        <ThemedView style={styles.headerContainer}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="defaultSemiBold" style={styles.name}>
              {item.name}
            </ThemedText>
            <ThemedText style={styles.brand}>{item.brand}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.typeContainer}>
            <ThemedText style={styles.type}>{item.type}</ThemedText>
            <ThemedText style={styles.country}>{item.country}</ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView style={styles.detailsContainer}>
          <ThemedText style={styles.details}>도수: {item.abv}%</ThemedText>
          <ThemedText style={styles.details}>용량: {item.volume}ml</ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
};

export default function MyCollectionScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Collection</ThemedText>
      </ThemedView>
      
      {tempData.length === 0 ? (
        <ThemedText style={styles.emptyText}>내 컬렉션이 비어있습니다.</ThemedText>
      ) : (
        <FlatList
          data={tempData}
          renderItem={({ item }) => <LiquorItem item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  listContainer: {
    gap: 12,
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imageContainer: {
    width: 80,
    height: 120,  // 높이를 좀 더 늘려서 와인/위스키 병 이미지에 적합하게 수정
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden', // 이미지가 컨테이너를 벗어나지 않도록
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerContainer: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    marginBottom: 2,
  },
  brand: {
    fontSize: 12,
    opacity: 0.7,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  type: {
    fontSize: 13,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  country: {
    fontSize: 13,
    opacity: 0.7,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  details: {
    fontSize: 12,
    opacity: 0.8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
  },
  hiddenImage: {
    opacity: 0,
  },
  imageStateContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
  loadingText: {
    fontSize: 10,
    marginTop: 8,
    opacity: 0.7,
  },
  retryButton: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 10,
    marginTop: 4,
    color: '#FF3B30',
  },
  itemPressed: {
    opacity: 0.7,
  },
});
