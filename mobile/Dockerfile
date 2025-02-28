# 현재 로컬과 동일한 Node.js 버전 사용
FROM node:23.7.0-alpine

WORKDIR /app

# 필요한 시스템 패키지 설치
RUN apk add --no-cache git

# package*.json 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 소스 코드 복사
COPY . .

# Expo CLI 전역 설치
RUN npm install -g expo-cli

# 웹 모드로 Expo 실행
CMD ["npx", "expo", "start", "--web"]