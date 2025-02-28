type Environment = {
  apiUrl: string;
  env: 'dev' | 'prd';
};

const ENV = {
  dev: {
    apiUrl: 'http://localhost:20010',
    env: 'dev',
  },
  prd: {
    apiUrl: 'https://3.36.132.159:20010',  // 실제 프로덕션 URL
    env: 'prd',
  },
} as const;

const getEnvVars = (): Environment => {
  // Docker 환경에서는 REACT_APP_ENV 환경변수를 통해 환경 설정
  const environment = process.env.EXPO_PUBLIC_APP_ENV || 'dev';
  
  if (environment === 'prd') {
    return ENV.prd;
  }
  
  return ENV.dev;
};

export default getEnvVars(); 