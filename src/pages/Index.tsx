import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  subtasks: Task[];
  isExpanded: boolean;
  emoji: string;
}

interface User {
  id: number;
  email: string;
}

const EMOJI_POOL = ['🌟', '🎨', '🚀', '🌈', '✨', '🎭', '🦄', '🌸', '🎪', '🎯'];

const getRandomEmoji = () => EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];

const STORAGE_KEY = 'creative-todos';
const USER_KEY = 'creative-user';

const AUTH_URL = 'https://functions.poehali.dev/6482146f-f986-4fab-b9b9-c363f3e5c004';
const TASKS_URL = 'https://functions.poehali.dev/8417072c-5f63-4a6c-8b8b-55e45c075bfe';

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        loadTasksFromServer(parsedUser.id);
      } catch (e) {
        console.error('Failed to load user:', e);
        loadLocalTasks();
      }
    } else {
      loadLocalTasks();
    }
  }, []);

  const loadLocalTasks = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load tasks:', e);
      }
    } else {
      const initialTasks: Task[] = [
        {
          id: '1',
          text: 'Создать проект',
          completed: true,
          emoji: '🚀',
          isExpanded: true,
          subtasks: [
            {
              id: '1-1',
              text: 'Придумать идею',
              completed: true,
              emoji: '💡',
              isExpanded: false,
              subtasks: []
            }
          ]
        }
      ];
      setTasks(initialTasks);
    }
  };

  const loadTasksFromServer = async (userId: number) => {
    try {
      const response = await fetch(TASKS_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.tasks && data.tasks.length > 0) {
          setTasks(data.tasks);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tasks));
        } else {
          loadLocalTasks();
        }
      }
    } catch (error) {
      console.error('Failed to load tasks from server:', error);
      loadLocalTasks();
    }
  };

  const saveTasksToServer = async (updatedTasks: Task[]) => {
    if (!user) return;
    
    try {
      await fetch(TASKS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ tasks: updatedTasks })
      });
    } catch (error) {
      console.error('Failed to save tasks to server:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    if (user && tasks.length > 0) {
      saveTasksToServer(tasks);
    }
  }, [tasks, user]);

  const handleLogin = async () => {
    if (!email.trim()) {
      toast.error('Введите email! 📧');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      const data = await response.json();

      if (response.ok) {
        const userData = { id: data.user_id, email: data.email };
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        toast.success('Добро пожаловать! 🎉');
        
        await loadTasksFromServer(data.user_id);
      } else {
        toast.error(data.error || 'Ошибка входа');
      }
    } catch (error) {
      toast.error('Не удалось подключиться к серверу');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    toast.success('Вы вышли из аккаунта 👋');
  };

  const addTask = (parentPath: number[] | null = null) => {
    if (!newTaskText.trim()) {
      toast.error('Введите текст задачи! 📝');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      subtasks: [],
      isExpanded: false,
      emoji: getRandomEmoji()
    };

    if (parentPath === null) {
      setTasks([...tasks, newTask]);
      toast.success('Задача добавлена! ' + newTask.emoji);
    } else {
      const newTasks = [...tasks];
      let current: Task[] = newTasks;
      
      for (let i = 0; i < parentPath.length - 1; i++) {
        current = current[parentPath[i]].subtasks;
      }
      
      current[parentPath[parentPath.length - 1]].subtasks.push(newTask);
      current[parentPath[parentPath.length - 1]].isExpanded = true;
      setTasks(newTasks);
      toast.success('Подзадача добавлена! ' + newTask.emoji);
    }

    setNewTaskText('');
  };

  const toggleTask = (path: number[]) => {
    const newTasks = [...tasks];
    let current: Task[] = newTasks;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]].subtasks;
    }
    
    current[path[path.length - 1]].completed = !current[path[path.length - 1]].completed;
    setTasks(newTasks);
  };

  const toggleExpanded = (path: number[]) => {
    const newTasks = [...tasks];
    let current: Task[] = newTasks;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]].subtasks;
    }
    
    current[path[path.length - 1]].isExpanded = !current[path[path.length - 1]].isExpanded;
    setTasks(newTasks);
  };

  const deleteTask = (path: number[]) => {
    const newTasks = [...tasks];
    
    if (path.length === 1) {
      newTasks.splice(path[0], 1);
    } else {
      let current: Task[] = newTasks;
      for (let i = 0; i < path.length - 2; i++) {
        current = current[path[i]].subtasks;
      }
      current[path[path.length - 2]].subtasks.splice(path[path.length - 1], 1);
    }
    
    setTasks(newTasks);
    toast.success('Задача удалена! 🗑️');
  };

  const TaskItem = ({ task, path }: { task: Task; path: number[] }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [subtaskText, setSubtaskText] = useState('');

    const handleAddSubtask = () => {
      if (!subtaskText.trim()) return;

      const newTask: Task = {
        id: Date.now().toString(),
        text: subtaskText,
        completed: false,
        subtasks: [],
        isExpanded: false,
        emoji: getRandomEmoji()
      };

      const newTasks = [...tasks];
      let current: Task[] = newTasks;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].subtasks;
      }
      
      const targetTask = current[path[path.length - 1]];
      targetTask.subtasks.push(newTask);
      targetTask.isExpanded = true;
      
      setTasks(newTasks);
      setSubtaskText('');
      setIsAdding(false);
      toast.success('Подзадача добавлена! ' + newTask.emoji);
    };

    return (
      <div className="animate-fade-in">
        <div className={`group flex items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 ${
          task.completed 
            ? 'bg-muted/50 border-muted' 
            : 'bg-card border-border hover:border-primary hover:shadow-lg'
        }`}>
          <button
            onClick={() => toggleExpanded(path)}
            className={`text-2xl transition-transform duration-300 ${
              task.isExpanded ? 'rotate-90' : ''
            } ${task.subtasks.length === 0 ? 'opacity-0 pointer-events-none' : 'hover:scale-125'}`}
          >
            ▶️
          </button>

          <span className="text-3xl animate-wiggle">{task.emoji}</span>

          <Checkbox
            checked={task.completed}
            onCheckedChange={() => toggleTask(path)}
            className="h-6 w-6 border-2"
          />

          <span className={`flex-1 text-lg ${task.completed ? 'line-through opacity-50' : ''}`}>
            {task.text}
          </span>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsAdding(!isAdding)}
              className="h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-primary-foreground"
            >
              <Icon name="Plus" size={18} />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteTask(path)}
              className="h-8 w-8 p-0 rounded-full hover:bg-destructive hover:text-destructive-foreground"
            >
              <Icon name="Trash2" size={18} />
            </Button>
          </div>
        </div>

        {isAdding && (
          <div className="ml-12 mt-2 flex gap-2 animate-scale-in">
            <Input
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              placeholder="Новая подзадача..."
              className="flex-1 border-2 rounded-xl"
              autoFocus
            />
            <Button
              onClick={handleAddSubtask}
              size="sm"
              className="rounded-xl"
            >
              <Icon name="Check" size={18} />
            </Button>
            <Button
              onClick={() => setIsAdding(false)}
              size="sm"
              variant="outline"
              className="rounded-xl"
            >
              <Icon name="X" size={18} />
            </Button>
          </div>
        )}

        {task.isExpanded && task.subtasks.length > 0 && (
          <div className="ml-12 mt-3 space-y-2 border-l-4 border-primary/30 pl-4">
            {task.subtasks.map((subtask, index) => (
              <TaskItem key={subtask.id} task={subtask} path={[...path, index]} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const completedCount = tasks.reduce((acc, task) => {
    const countCompleted = (t: Task): number => {
      return (t.completed ? 1 : 0) + t.subtasks.reduce((sum, st) => sum + countCompleted(st), 0);
    };
    return acc + countCompleted(task);
  }, 0);

  const totalCount = tasks.reduce((acc, task) => {
    const countAll = (t: Task): number => {
      return 1 + t.subtasks.reduce((sum, st) => sum + countAll(st), 0);
    };
    return acc + countAll(task);
  }, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 space-y-6 animate-scale-in border-2 border-primary shadow-2xl">
          <div className="text-center space-y-4">
            <div className="text-7xl">🔐</div>
            <h1 className="text-5xl font-bold text-primary">Вход</h1>
            <p className="text-lg text-muted-foreground">Введите email для входа или регистрации</p>
          </div>
          
          <div className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="your@email.com"
              className="text-lg border-2 rounded-2xl px-6 py-6"
              disabled={isLoading}
            />
            <Button
              onClick={handleLogin}
              size="lg"
              className="w-full rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={24} className="mr-2 animate-spin" />
                  Входим...
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={24} className="mr-2" />
                  Войти
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground bg-muted/50 p-4 rounded-xl">
            💡 Ваши задачи будут синхронизироваться между устройствами
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="text-center space-y-2 animate-scale-in">
          <h1 className="text-6xl font-bold text-primary">Волшебный Список Дел</h1>
          <p className="text-xl text-muted-foreground">Бесконечно вложенные задачи! 🌳</p>
          
          <div className="flex justify-center gap-4 text-sm mt-4 flex-wrap">
            <div className="bg-card px-6 py-3 rounded-full border-2 border-primary shadow-lg">
              <span className="font-semibold text-primary">{completedCount}</span>
              <span className="text-muted-foreground"> / {totalCount} выполнено</span>
            </div>
            <div className="bg-card px-6 py-3 rounded-full border-2 border-secondary shadow-lg">
              <span className="text-sm">👤 {user.email}</span>
            </div>
            <Button
              onClick={handleLogout}
              size="sm"
              variant="outline"
              className="rounded-full border-2"
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border-2 border-primary shadow-2xl animate-scale-in">
          <div className="flex gap-2">
            <Input
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Придумай новую задачу... ✨"
              className="flex-1 text-lg border-2 rounded-2xl px-6 py-6"
            />
            <Button
              onClick={() => addTask()}
              size="lg"
              className="rounded-2xl px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Icon name="Plus" size={24} className="mr-2" />
              Добавить
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="text-8xl mb-4">🎨</div>
              <p className="text-2xl text-muted-foreground font-medium">
                Список пуст! Создай первую задачу
              </p>
            </div>
          ) : (
            tasks.map((task, index) => <TaskItem key={task.id} task={task} path={[index]} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;