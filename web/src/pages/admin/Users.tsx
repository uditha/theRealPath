import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Users, Search, ArrowUpDown, Mail, Award, Heart, BookOpen, CreditCard } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
  languagePreference: string;
  totalXP: number;
  level: number;
  hearts: number;
  maxHearts: number;
  dailyGoalXP: number;
  lessonsCompleted: number;
  cardsCollected: number;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'level' | 'xp' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => adminService.getUsers(),
  });

  // Filter and sort users (MUST be before early returns)
  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return [];

    // Filter users
    let filtered = users.filter((user: User) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (user.name?.toLowerCase().includes(searchLower) || false) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.level.toString().includes(searchLower)
      );
    });

    // Sort
    filtered.sort((a: User, b: User) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = (a.name || a.email).toLowerCase();
          bValue = (b.name || b.email).toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'xp':
          aValue = a.totalXP;
          bValue = b.totalXP;
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, sortBy, sortOrder]);

  const handleSort = (column: 'name' | 'email' | 'level' | 'xp' | 'created') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground animate-pulse">Loading users...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-destructive">
            <p className="font-semibold">Error loading users</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all registered users
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or level..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        {filteredAndSortedUsers.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 text-left font-semibold">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          User
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="p-4 text-left font-semibold">
                        <button
                          onClick={() => handleSort('email')}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Email
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="p-4 text-left font-semibold">
                        <button
                          onClick={() => handleSort('level')}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Level
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="p-4 text-left font-semibold">
                        <button
                          onClick={() => handleSort('xp')}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          XP
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="p-4 text-left font-semibold">Stats</th>
                      <th className="p-4 text-left font-semibold">
                        <button
                          onClick={() => handleSort('created')}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Joined
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedUsers.map((user: User) => (
                      <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.name || user.email}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">
                                {user.name || 'No name'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.languagePreference === 'si' ? 'සිංහල' : 'English'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-500" />
                            <span className="font-semibold">Level {user.level}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{user.totalXP.toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Heart className="h-3 w-3 text-red-500" />
                              <span>{user.hearts}/{user.maxHearts}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <BookOpen className="h-3 w-3 text-blue-500" />
                              <span>{user.lessonsCompleted} lessons</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard className="h-3 w-3 text-purple-500" />
                              <span>{user.cardsCollected} cards</span>
                            </div>
                            {user.streak && user.streak.currentStreak > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-orange-500">🔥</span>
                                <span>{user.streak.currentStreak} day streak</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No users found' : 'No users yet'}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Users will appear here once they register'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

