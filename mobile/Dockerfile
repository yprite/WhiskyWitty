FROM node:16

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# TypeScript 의존성 추가 설치
RUN npm install --save-dev @types/react-native@0.72.0

# 소스 코드 복사
COPY . .

# 새로운 expo CLI 설치
RUN npm install expo@latest

# 10011 포트 노출
EXPOSE 10011

# 웹 서버 실행
CMD ["sh", "-c", "npm install && npx expo start --web --port 10011"] 