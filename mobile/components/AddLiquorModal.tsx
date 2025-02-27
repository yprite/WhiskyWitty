import { Modal, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

type AddLiquorModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (liquor: {
    name: string;
    type: string;
    description: string;
    image?: string;
    details: {
      alcohol: string;
      volume: string;
      manufacturer: string;
      origin: string;
    };
  }) => void;
};

const LIQUOR_TYPES = [
  '맥주',
  '소주',
  '막걸리',
  '위스키',
  '보드카',
  '진',
  '럼',
  '와인',
  '사케',
  '브랜디',
  '데킬라',
  '기타',
] as const;

export function AddLiquorModal({ visible, onClose, onSubmit }: AddLiquorModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [alcoholPercent, setAlcoholPercent] = useState(0);
  const [volume, setVolume] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [origin, setOrigin] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isEditingAlcohol, setIsEditingAlcohol] = useState(false);
  const [alcoholInput, setAlcoholInput] = useState('');
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [customType, setCustomType] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('이미지를 선택하기 위해서는 갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !type.trim()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      type: type.trim(),
      description: description.trim(),
      image: image || undefined,
      details: {
        alcohol: `${alcoholPercent}%`,
        volume: volume.trim(),
        manufacturer: manufacturer.trim(),
        origin: origin.trim(),
      },
    });

    setName('');
    setType('');
    setDescription('');
    setAlcoholPercent(0);
    setVolume('');
    setManufacturer('');
    setOrigin('');
    setImage(null);
    onClose();
  };

  const handleIncrement = () => {
    setAlcoholPercent(prev => Math.min(100, prev + 0.5));
  };

  const handleDecrement = () => {
    setAlcoholPercent(prev => Math.max(0, prev - 0.5));
  };

  const handleAlcoholInputChange = (text: string) => {
    const filtered = text.replace(/[^0-9.]/g, '');
    setAlcoholInput(filtered);
  };

  const handleAlcoholInputComplete = () => {
    const value = parseFloat(alcoholInput);
    if (!isNaN(value)) {
      const validValue = Math.min(100, Math.max(0, value));
      setAlcoholPercent(validValue);
    }
    setIsEditingAlcohol(false);
  };

  const handleTypeSelect = (selectedType: string) => {
    if (selectedType === '기타') {
      setCustomType('');
      setType('');
    } else {
      setType(selectedType);
    }
    setIsTypeModalVisible(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <ThemedView style={styles.centeredView}>
        <ThemedView style={styles.modalView}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">새로운 술 추가</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <ThemedText style={styles.closeButton}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.content}>
            <ThemedView style={styles.imageContainer}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <ThemedView style={styles.imagePlaceholder}>
                    <ThemedText>이미지 선택</ThemedText>
                  </ThemedView>
                )}
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText type="defaultSemiBold">이름 *</ThemedText>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="술 이름을 입력하세요"
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText type="defaultSemiBold">종류 *</ThemedText>
              <TouchableOpacity
                style={styles.typeSelector}
                onPress={() => setIsTypeModalVisible(true)}
              >
                <ThemedText style={type ? styles.typeText : styles.typePlaceholder}>
                  {type || '술 종류를 선택하세요'}
                </ThemedText>
                <ThemedText style={styles.dropdownIcon}>▼</ThemedText>
              </TouchableOpacity>
              {type === '기타' && (
                <TextInput
                  style={styles.input}
                  value={customType}
                  onChangeText={(text) => {
                    setCustomType(text);
                    setType(text);
                  }}
                  placeholder="직접 입력"
                />
              )}
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText type="defaultSemiBold">설명</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="술에 대한 설명을 입력하세요"
                multiline
                numberOfLines={4}
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText type="defaultSemiBold">상세 정보</ThemedText>
              
              <ThemedView style={styles.alcoholPicker}>
                <ThemedText>도수 (%):</ThemedText>
                <ThemedView style={styles.pickerContainer}>
                  <TouchableOpacity 
                    style={styles.pickerButton} 
                    onPress={handleDecrement}
                  >
                    <ThemedText style={styles.pickerButtonText}>-</ThemedText>
                  </TouchableOpacity>
                  
                  {isEditingAlcohol ? (
                    <TextInput
                      style={styles.alcoholInput}
                      value={alcoholInput}
                      onChangeText={handleAlcoholInputChange}
                      keyboardType="decimal-pad"
                      onBlur={handleAlcoholInputComplete}
                      onSubmitEditing={handleAlcoholInputComplete}
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity 
                      style={styles.pickerValue}
                      onPress={() => {
                        setAlcoholInput(alcoholPercent.toFixed(1));
                        setIsEditingAlcohol(true);
                      }}
                    >
                      <ThemedText style={styles.pickerValueText}>
                        {alcoholPercent.toFixed(1)}%
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.pickerButton} 
                    onPress={handleIncrement}
                  >
                    <ThemedText style={styles.pickerButtonText}>+</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>

              <TextInput
                style={styles.input}
                value={volume}
                onChangeText={setVolume}
                placeholder="용량 (예: 360ml)"
              />
              <TextInput
                style={styles.input}
                value={manufacturer}
                onChangeText={setManufacturer}
                placeholder="제조사"
              />
              <TextInput
                style={styles.input}
                value={origin}
                onChangeText={setOrigin}
                placeholder="원산지"
              />
            </ThemedView>
          </ScrollView>

          <ThemedView style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <ThemedText style={styles.buttonText}>추가하기</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isTypeModalVisible}
        onRequestClose={() => setIsTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.typeModalOverlay}
          activeOpacity={1}
          onPress={() => setIsTypeModalVisible(false)}
        >
          <ThemedView style={styles.typeModalContent}>
            <ThemedView style={styles.typeModalHeader}>
              <ThemedText type="title">술 종류 선택</ThemedText>
              <TouchableOpacity onPress={() => setIsTypeModalVisible(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            <ScrollView style={styles.typeList}>
              {LIQUOR_TYPES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.typeItem,
                    type === item && styles.selectedTypeItem,
                  ]}
                  onPress={() => handleTypeSelect(item)}
                >
                  <ThemedText
                    style={[
                      styles.typeItemText,
                      type === item && styles.selectedTypeItemText,
                    ]}
                  >
                    {item}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        </TouchableOpacity>
      </Modal>
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
  content: {
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 16,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#0d6efd',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageButton: {
    width: 150,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  alcoholPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerButton: {
    padding: 12,
    borderRadius: 8,
  },
  pickerButtonText: {
    fontSize: 18,
    color: '#0d6efd',
    fontWeight: '600',
  },
  alcoholInput: {
    paddingHorizontal: 20,
    minWidth: 80,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerValue: {
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  pickerValueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  typeText: {
    fontSize: 16,
  },
  typePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  typeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  typeModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  typeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  typeList: {
    maxHeight: '100%',
  },
  typeItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  selectedTypeItem: {
    backgroundColor: '#e7f1ff',
  },
  typeItemText: {
    fontSize: 16,
  },
  selectedTypeItemText: {
    color: '#0d6efd',
    fontWeight: '600',
  },
}); 