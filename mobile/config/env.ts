type Environment = {
  apiUrl: string;
  env: 'development' | 'production';
};

const ENV = {
  development: {
    apiUrl: 'http://localhost:20010',
    env: 'development',
  },
  production: {
    apiUrl: 'https://your-production-api.com',  // 실제 프로덕션 URL
    env: 'production',
  },
} as const;

const getEnvVars = (): Environment => {
  // Docker 환경에서는 REACT_APP_ENV 환경변수를 통해 환경 설정
  const environment = process.env.REACT_APP_ENV || 'development';
  
  if (environment === 'production') {
    return ENV.production;
  }
  
  return ENV.development;
};

export default getEnvVars(); 