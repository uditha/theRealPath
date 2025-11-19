import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600">Welcome, {user?.name || 'User'}!</p>
      <p className="text-gray-500 mt-4">Add your dashboard content here.</p>
    </div>
  );
};

