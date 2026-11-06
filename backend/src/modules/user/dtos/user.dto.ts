export interface UserCreateDto {
  telegramId: string;
  firstName: string;
  userName: string | null;
}

export interface UserDto {
  id: string;
  telegramId: string;
  firstName: string;
  userName: string | null;
  isConfirmed: boolean;
}

export type ResponseDto = UserDto | null;
