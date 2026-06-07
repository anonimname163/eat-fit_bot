// Общие перечисления домена Eat&fit (используются и API, и фронтом).

export enum Role {
  Client = 'client',
  Cook = 'cook',
  Courier = 'courier',
  Admin = 'admin',
}

export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cooking = 'cooking',
  Delivering = 'delivering',
  Done = 'done',
  Cancelled = 'cancelled',
}

export enum Category {
  Main = 'main',
  Drink = 'drink',
  Dessert = 'dessert',
}

export enum Language {
  Ru = 'ru',
  Uz = 'uz',
}
