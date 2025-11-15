export interface Video {
  id: number;
  url: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  price: number;
  category: string;
}

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export enum ModalType {
  SignIn = 'signIn',
  SignUp = 'signUp',
}

export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export type LanguageCode = 'en' | 'pt' | 'es' | 'fr' | 'zh' | 'ko' | 'de';