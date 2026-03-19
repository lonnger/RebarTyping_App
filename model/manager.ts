import * as SQLite from 'expo-sqlite';

interface UserRow {
  id: number;
  name: string;
  password: string;
  company: string;
  position: string;
  number: string;
}

class UserModel {
  id: number;
  name: string;
  password: string;
  company: string;
  position: string;
  number: string;

  constructor(data: UserRow) {
    this.id = data.id;
    this.name = data.name;
    this.password = data.password;
    this.company = data.company;
    this.position = data.position;
    this.number = data.number;
  }
}

class MyDatabaase {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  async init() {
    if (!this.isInitialized) {
      await this.getSqLiteDb();
      this.isInitialized = true;
    }
    return this;
  }

  async getSqLiteDb() {
    this.db = await SQLite.openDatabaseAsync('databaseName');
  }

  async initDatabase() {
    if (!this.db || !this.isInitialized) {
      await this.init();
    }

    if (this.db) {
      await this.db.execAsync(
        `CREATE TABLE IF NOT EXISTS user(id INTEGER PRIMARY KEY NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,company TEXT,position TEXT,number TEXT)`
      );
      await this.db.execAsync(
        'INSERT OR IGNORE INTO user VALUES(0,"admin","hkcrc","HKCRC","HongKong","85223563130")'
      );
    }
  }

  async getUser(): Promise<UserModel[]> {
    if (!this.db || !this.isInitialized) {
      await this.init();
    }

    if (this.db) {
      try {
        // 查询表中的所有数据
        const userMaps = await this.db.getAllAsync<Record<string, any>>('SELECT * FROM user');
        const userList: UserModel[] = [];

        // 将查询结果映射到UserModel对象
        for (const userMap of userMaps) {
          const userItem = new UserModel({
            id: userMap['id'] as number,
            name: userMap['name'] as string,
            password: userMap['password'] as string,
            company: userMap['company'] as string,
            position: userMap['position'] as string,
            number: userMap['number'] as string,
          });
          userList.push(userItem);
        }

        return userList;
      } catch (error) {
        console.error('Database query error:', error);
        return [];
      }
    }
    return [];
  }
}

const database = new MyDatabaase();
export default database;
