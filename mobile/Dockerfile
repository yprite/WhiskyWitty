FROM node:18

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 웹 빌드를 위한 expo-cli 설치
RUN npm install -g expo-cli

# 10011 포트 노출
EXPOSE 10011

# 웹 서버 실행
CMD ["sh", "-c", "npm install && EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 expo start --web --port 10011"] 