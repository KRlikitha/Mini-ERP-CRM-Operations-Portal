import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { CustomerView } from './views/CustomerView';
import { ProductView } from './views/ProductView';
import { ChallanView } from './views/ChallanView';

const MainAppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <LoginView />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
      {activeTab === 'customers' && <CustomerView />}
      {activeTab === 'products' && <ProductView />}
      {activeTab === 'challans' && <ChallanView />}
    </Layout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
