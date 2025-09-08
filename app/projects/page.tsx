import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProjectsPage() {
  const projects = [
    {
      id: '1',
      name: 'Website Redesign',
      description: 'Complete overhaul of company website with modern design',
      status: 'active',
      progress: 65,
      tasks: 12,
      completedTasks: 8,
      dueDate: '2024-02-15',
      team: ['John', 'Sarah', 'Mike']
    },
    {
      id: '2',
      name: 'Mobile App Development',
      description: 'Native mobile app for iOS and Android platforms',
      status: 'planning',
      progress: 15,
      tasks: 25,
      completedTasks: 4,
      dueDate: '2024-04-30',
      team: ['Alice', 'Bob', 'Charlie']
    },
    {
      id: '3',
      name: 'Database Migration',
      description: 'Migrate legacy database to new cloud infrastructure',
      status: 'completed',
      progress: 100,
      tasks: 8,
      completedTasks: 8,
      dueDate: '2024-01-10',
      team: ['David', 'Eve']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Organize and track your projects and milestones
          </p>
        </div>
        <Button>
          <span className="mr-2">➕</span>
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 bg-primary rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex justify-between text-sm">
                  <span>Tasks</span>
                  <span>{project.completedTasks}/{project.tasks}</span>
                </div>

                {/* Due Date */}
                <div className="flex justify-between text-sm">
                  <span>Due Date</span>
                  <span>{new Date(project.dueDate).toLocaleDateString()}</span>
                </div>

                {/* Team */}
                <div>
                  <div className="text-sm mb-2">Team</div>
                  <div className="flex -space-x-2">
                    {project.team.map((member, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-background"
                        title={member}
                      >
                        {member.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <span className="text-2xl">📁</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <span className="text-2xl">🚀</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
                </p>
              </div>
              <span className="text-2xl">📊</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Project Management</h3>
          <p className="text-gray-600 mb-4">
            Full project management features including Gantt charts, milestones, and team collaboration coming soon.
          </p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <span>• Gantt Charts</span>
            <span>• Milestone Tracking</span>
            <span>• Team Collaboration</span>
            <span>• Time Tracking</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
