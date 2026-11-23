/**
 * Espelho dos DTOs da API (`apps/api`). Os tipos são escritos à mão porque não
 * há geração a partir do C#; o teste de contrato usa os nomes reais dos campos
 * e quebra se algum divergir.
 */

export type ActivityType =
  | 'selectSymbols'
  | 'dragSymbols'
  | 'buildWord'
  | 'readSentence'
  | 'selectPicture'
  | 'completeWord';

export type ModuleStatus = 'locked' | 'current' | 'completed';

export type UserRole = 'student' | 'guardian' | 'admin';

export type User = {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: User;
};

export type ActivityProgress = {
  activitySlug: string;
  bestScore: number;
  attempts: number;
  errors: number;
  stars: number;
  completedAt: string | null;
};

export type Activity = {
  slug: string;
  title: string;
  type: ActivityType;
  order: number;
  isRequired: boolean;
  /** JSON do catálogo; o front só interpreta o que conhece. */
  configJson: string;
  progress: ActivityProgress | null;
};

export type Module = {
  slug: string;
  title: string;
  description: string;
  concept: string;
  order: number;
  status: ModuleStatus;
  isUnlocked: boolean;
  requiredTotal: number;
  requiredCompleted: number;
  stars: number;
  maxStars: number;
  activities: Activity[];
};

export type Catalog = {
  modules: Module[];
};

/** Corpo aceito por `PUT /progress/activities/{slug}`. */
export type ActivityProgressInput = {
  bestScore: number;
  attempts: number;
  errors: number;
  completed: boolean;
};

export type ImportProgressItem = ActivityProgressInput & {
  activitySlug: string;
};

export type ImportProgressInput = {
  items: ImportProgressItem[];
};

export type ImportProgressResponse = {
  imported: number;
};

/** `ProblemDetails` que a API devolve em erro. */
export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
};
