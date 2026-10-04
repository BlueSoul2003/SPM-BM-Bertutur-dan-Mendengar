import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import App from './App.tsx';
import { CourseEntry } from './components/CourseEntry';
import './index.css';
import { LanguageProvider } from './i18n/LanguageProvider';
import { LanguageBar } from './components/LanguageBar';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider><LanguageBar/><AppErrorBoundary><CourseEntry><App /></CourseEntry></AppErrorBoundary></LanguageProvider>
  </StrictMode>,
);
