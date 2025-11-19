import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Globe, BookOpen, GraduationCap, CreditCard, Users, Plus, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminService.getStats(),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground animate-pulse">Loading...</div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: 'Worlds',
      value: stats?.worlds || 0,
      icon: Globe,
      color: 'from-blue-500 to-blue-600',
      link: '/admin/worlds',
    },
    {
      title: 'Chapters',
      value: stats?.chapters || 0,
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      link: '/admin/chapters',
    },
    {
      title: 'Lessons',
      value: stats?.lessons || 0,
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      link: '/admin/lessons',
    },
    {
      title: 'Cards',
      value: stats?.cards || 0,
      icon: CreditCard,
      color: 'from-amber-500 to-amber-600',
      link: '/admin/cards',
    },
    {
      title: 'Users',
      value: stats?.users || 0,
      icon: Users,
      color: 'from-rose-500 to-rose-600',
    },
  ];

  const quickActions = [
    {
      title: 'Create World',
      description: 'Add a new learning world',
      icon: Globe,
      link: '/admin/worlds/new',
      color: 'hover:border-blue-500 hover:bg-blue-50',
    },
    {
      title: 'Create Chapter',
      description: 'Add a new chapter',
      icon: BookOpen,
      link: '/admin/chapters/new',
      color: 'hover:border-green-500 hover:bg-green-50',
    },
    {
      title: 'Create Lesson',
      description: 'Add a new lesson',
      icon: GraduationCap,
      link: '/admin/lessons/new',
      color: 'hover:border-purple-500 hover:bg-purple-50',
    },
    {
      title: 'Create Card',
      description: 'Add a new wisdom card',
      icon: CreditCard,
      link: '/admin/cards/new',
      color: 'hover:border-amber-500 hover:bg-amber-50',
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's an overview of your content.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const content = (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div
                      className={cn(
                        'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform',
                        stat.color
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );

            if (stat.link) {
              return (
                <Link key={stat.title} to={stat.link}>
                  {content}
                </Link>
              );
            }

            return <div key={stat.title}>{content}</div>;
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Create new content quickly from here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} to={action.link}>
                    <div
                      className={cn(
                        'p-6 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer group',
                        'border-border hover:shadow-md',
                        action.color
                      )}
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="h-6 w-6 text-muted-foreground group-hover:text-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{action.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {action.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Create <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
