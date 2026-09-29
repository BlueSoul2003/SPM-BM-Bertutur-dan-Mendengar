import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import App from './App.tsx';
import { CourseEntry } from './components/CourseEntry';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary><CourseEntry><App /></CourseEntry></AppErrorBoundary>
  </StrictMode>,
);
