import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { getCostumeId } from './engine/storage';
import { applyCostume } from './engine/applyCostume';
import { CostumeProvider } from './engine/CostumeContext';
import { COSTUME_REGISTRY } from './costumes/registry';

// Apply the costume before the first render to avoid a flash of unstyled content.
const id = getCostumeId();
applyCostume(COSTUME_REGISTRY[id]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CostumeProvider initialId={id}>
      <App />
    </CostumeProvider>
  </StrictMode>,
);
