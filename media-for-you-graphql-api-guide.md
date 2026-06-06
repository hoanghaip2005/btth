# Huong dan trien khai GraphQL API cho ung dung "Media For You"

## 1. Muc tieu

- Xay dung GraphQL API cho ung dung "Media For You".
- Trien khai theo kien truc Microservices su dung Express.js, Knex.js, Apollo Server va gRPC.
- Su dung duy nhat 1 Database server PostgreSQL chay bang Docker, port database tren may host la `15432`.
- API server co duy nhat 1 endpoint GraphQL:

```text
http://localhost:23162/graphql
```

Giai thich port: MSSV la `2302700162`, lay 2 ky so dau `23` va 3 ky so cuoi `162`, nen port server la `23162`.

## 2. Yeu cau

- He thong gom cac nhom chuc nang:
  - Quan ly tai khoan va ho so ca nhan.
  - Kham pha bai hat, co phan trang va xem chi tiet.
  - Quan ly playlist ca nhan.
  - Quan ly bai hat trong playlist.
  - Phan quyen xem playlist cong khai/rieng tu.
- Cau truc project phai dat:
  - Tat ca file `.proto` trong thu muc `"/protos"`.
  - Cac service con trong thu muc `"/services"`.
- Phai co file `.env` de luu port, key, URL, thong tin database.
- Phai co script duy nhat tai thu muc goc cho cac tac vu:
  - Cai dependencies: `npm install`
  - Database migration: `npm run migrate`
  - Seed data: `npm run seed`
  - Khoi chay he thong: `npm run dev`
- Khong sua schema GraphQL da cho. Phan nao khong cai dat thi luoc bo, nhung bai nay se cai dat day du cac schema trong de.

## 3. Huong dan

### 3.1 Khoi tao project

- Chuyen terminal ve thu muc hien hanh la `<root>`:

```bash
cd <root>
```

- Khoi tao Node.js project va bat ES Module:

```bash
npm init -y
npm pkg set type="module"
```

- Cai dat cac package can thiet:

```bash
npm i express @apollo/server @as-integrations/express5 graphql cors dotenv knex pg bcryptjs jsonwebtoken @grpc/grpc-js @grpc/proto-loader concurrently
```

- Tao cau truc thu muc:

```bash
mkdir -p db/migrations
mkdir -p db/seeds
mkdir -p protos
mkdir -p services/shared
mkdir -p services/user-service/src
mkdir -p services/song-service/src
mkdir -p services/playlist-service/src
mkdir -p services/api-server/src
```

### 3.2 Cau hinh package va bien moi truong

- Cap nhat file `"/package.json"` nhu sau:

```json
{
  "name": "media-for-you",
  "version": "1.0.0",
  "type": "module",
  "main": "services/api-server/src/server.js",
  "scripts": {
    "migrate": "knex migrate:latest --knexfile db/knexfile.cjs",
    "seed": "knex seed:run --knexfile db/knexfile.cjs",
    "dev": "concurrently -k -n user,song,playlist,api \"node services/user-service/src/server.js\" \"node services/song-service/src/server.js\" \"node services/playlist-service/src/server.js\" \"node services/api-server/src/server.js\""
  },
  "dependencies": {
    "@apollo/server": "^4.12.2",
    "@as-integrations/express5": "^1.1.2",
    "@grpc/grpc-js": "^1.13.4",
    "@grpc/proto-loader": "^0.7.15",
    "bcryptjs": "^3.0.2",
    "concurrently": "^9.2.0",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "graphql": "^16.11.0",
    "jsonwebtoken": "^9.0.2",
    "knex": "^3.1.0",
    "pg": "^8.16.0"
  }
}
```

- Tao file `"/.env"` va viet code:

```env
PORT=23162
NODE_ENV=development

DB_HOST=localhost
DB_PORT=15432
DB_USER=admin
DB_PASSWORD=123456
DB_NAME=media_for_you

JWT_SECRET=media_for_you_2302700162_secret
JWT_EXPIRES_IN=7d

USER_GRPC_URL=localhost:50051
SONG_GRPC_URL=localhost:50052
PLAYLIST_GRPC_URL=localhost:50053
```

- Tao file `"/docker-compose.yml"` va viet code:

```yml
services:
  db:
    image: postgres:15-alpine
    container_name: media_for_you_db
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: "123456"
      POSTGRES_DB: media_for_you
    ports:
      - "15432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d media_for_you"]
      interval: 5s
      timeout: 30s
      retries: 5
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

- Chay Database server bang Docker:

```bash
docker compose up -d
```

### 3.3 Cau hinh database, migration va seed

- Tao file `"/db/knexfile.cjs"` va viet code:

```js
require("dotenv").config();

module.exports = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    migrations: {
      directory: "./db/migrations"
    },
    seeds: {
      directory: "./db/seeds"
    }
  }
};
```

- Tao file `"/db/migrations/001_create_media_for_you_schema.cjs"` va viet code:

```js
exports.up = async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("full_name").notNullable();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("songs", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("title").notNullable();
    table.string("artist").notNullable();
    table.integer("duration_seconds").notNullable();
    table.string("genre").notNullable();
    table.text("audio_url").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("playlists", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name").notNullable();
    table.text("description");
    table.boolean("is_public").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("playlist_songs", (table) => {
    table.uuid("playlist_id").notNullable().references("id").inTable("playlists").onDelete("CASCADE");
    table.uuid("song_id").notNullable().references("id").inTable("songs").onDelete("CASCADE");
    table.integer("order_number").notNullable();
    table.primary(["playlist_id", "song_id"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("playlist_songs");
  await knex.schema.dropTableIfExists("playlists");
  await knex.schema.dropTableIfExists("songs");
  await knex.schema.dropTableIfExists("users");
};
```

- Tao file `"/db/seeds/001_seed_media_for_you.cjs"` va viet code:

```js
const bcrypt = require("bcryptjs");

exports.seed = async function seed(knex) {
  await knex("playlist_songs").del();
  await knex("playlists").del();
  await knex("songs").del();
  await knex("users").del();

  const passwordHash = await bcrypt.hash("123456", 10);

  const [user] = await knex("users")
    .insert({
      full_name: "Demo User",
      email: "demo@media.test",
      password_hash: passwordHash
    })
    .returning("*");

  const songs = await knex("songs")
    .insert([
      {
        title: "Golden Hour",
        artist: "JVKE",
        duration_seconds: 209,
        genre: "Pop",
        audio_url: "https://example.com/audio/golden-hour.mp3"
      },
      {
        title: "Blinding Lights",
        artist: "The Weeknd",
        duration_seconds: 200,
        genre: "Synth-pop",
        audio_url: "https://example.com/audio/blinding-lights.mp3"
      },
      {
        title: "Shape of You",
        artist: "Ed Sheeran",
        duration_seconds: 234,
        genre: "Pop",
        audio_url: "https://example.com/audio/shape-of-you.mp3"
      },
      {
        title: "Levitating",
        artist: "Dua Lipa",
        duration_seconds: 203,
        genre: "Disco",
        audio_url: "https://example.com/audio/levitating.mp3"
      },
      {
        title: "Nang Tho",
        artist: "Hoang Dung",
        duration_seconds: 248,
        genre: "V-Pop",
        audio_url: "https://example.com/audio/nang-tho.mp3"
      },
      {
        title: "See Tinh",
        artist: "Hoang Thuy Linh",
        duration_seconds: 185,
        genre: "V-Pop",
        audio_url: "https://example.com/audio/see-tinh.mp3"
      }
    ])
    .returning("*");

  const [playlist] = await knex("playlists")
    .insert({
      user_id: user.id,
      name: "Demo Public Playlist",
      description: "Playlist cong khai de test.",
      is_public: true
    })
    .returning("*");

  await knex("playlist_songs").insert([
    { playlist_id: playlist.id, song_id: songs[0].id, order_number: 1 },
    { playlist_id: playlist.id, song_id: songs[1].id, order_number: 2 }
  ]);
};
```

- Chay migration va seed:

```bash
npm run migrate
npm run seed
```

### 3.4 Tao cac file dung chung

- Tao file `"/services/shared/env.js"` va viet code:

```js
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
```

- Tao file `"/services/shared/db.js"` va viet code:

```js
import knex from "knex";
import "./env.js";

export const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
});
```

- Tao file `"/services/shared/grpc.js"` va viet code:

```js
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "node:path";

export { grpc };

export function loadProto(fileName) {
  const protoPath = path.resolve(process.cwd(), "protos", fileName);
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  return grpc.loadPackageDefinition(packageDefinition).media;
}

export function createGrpcServer(serviceDefinition, implementation, address) {
  const server = new grpc.Server();
  server.addService(serviceDefinition, implementation);
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    server.start();
    console.log(`gRPC server listening at ${address}`);
  });
}

export function grpcError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function handleGrpc(callback, handler) {
  try {
    const result = await handler();
    callback(null, result);
  } catch (error) {
    callback({
      code: error.code || grpc.status.INTERNAL,
      message: error.message || "Internal server error"
    });
  }
}
```

- Tao file `"/services/shared/mappers.js"` va viet code:

```js
function toIso(value) {
  return new Date(value).toISOString();
}

export function mapUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    createdAt: toIso(row.created_at)
  };
}

export function mapSong(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    durationSeconds: row.duration_seconds,
    genre: row.genre,
    audioUrl: row.audio_url,
    createdAt: toIso(row.created_at)
  };
}

export function mapPlaylistSummary(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public,
    createdAt: toIso(row.created_at)
  };
}

export function mapPlaylist(row, songs = []) {
  return {
    ...mapPlaylistSummary(row),
    songs
  };
}
```

### 3.5 Dinh nghia gRPC contracts

- Tao file `"/protos/user.proto"` va viet code:

```proto
syntax = "proto3";

package media;

message Empty {}

message User {
  string id = 1;
  string fullName = 2;
  string email = 3;
  string createdAt = 4;
}

message AuthPayload {
  User user = 1;
  string token = 2;
}

message RegisterRequest {
  string fullName = 1;
  string email = 2;
  string password = 3;
}

message LoginRequest {
  string email = 1;
  string password = 2;
}

message TokenRequest {
  string token = 1;
}

message UserIdRequest {
  string id = 1;
}

service UserService {
  rpc Register(RegisterRequest) returns (AuthPayload);
  rpc Login(LoginRequest) returns (AuthPayload);
  rpc VerifyToken(TokenRequest) returns (User);
  rpc GetMe(UserIdRequest) returns (User);
  rpc Logout(Empty) returns (Empty);
}
```

- Tao file `"/protos/song.proto"` va viet code:

```proto
syntax = "proto3";

package media;

message Song {
  string id = 1;
  string title = 2;
  string artist = 3;
  int32 durationSeconds = 4;
  string genre = 5;
  string audioUrl = 6;
  string createdAt = 7;
}

message PageInfo {
  int32 page = 1;
  int32 limit = 2;
  int32 total = 3;
  int32 totalPages = 4;
}

message SongPage {
  repeated Song items = 1;
  PageInfo pageInfo = 2;
}

message ListSongsRequest {
  int32 page = 1;
  int32 limit = 2;
}

message SongIdRequest {
  string id = 1;
}

service SongService {
  rpc ListSongs(ListSongsRequest) returns (SongPage);
  rpc GetSong(SongIdRequest) returns (Song);
}
```

- Tao file `"/protos/playlist.proto"` va viet code:

```proto
syntax = "proto3";

package media;

message Song {
  string id = 1;
  string title = 2;
  string artist = 3;
  int32 durationSeconds = 4;
  string genre = 5;
  string audioUrl = 6;
  string createdAt = 7;
}

message PageInfo {
  int32 page = 1;
  int32 limit = 2;
  int32 total = 3;
  int32 totalPages = 4;
}

message PlaylistSummary {
  string id = 1;
  string userId = 2;
  string name = 3;
  string description = 4;
  bool isPublic = 5;
  string createdAt = 6;
}

message Playlist {
  string id = 1;
  string userId = 2;
  string name = 3;
  string description = 4;
  bool isPublic = 5;
  string createdAt = 6;
  repeated Song songs = 7;
}

message PlaylistPage {
  repeated PlaylistSummary items = 1;
  PageInfo pageInfo = 2;
}

message UserIdRequest {
  string userId = 1;
}

message PlaylistIdRequest {
  string id = 1;
  string userId = 2;
}

message ListPlaylistsRequest {
  int32 page = 1;
  int32 limit = 2;
}

message CreatePlaylistRequest {
  string userId = 1;
  string name = 2;
  string description = 3;
  bool isPublic = 4;
}

message UpdatePlaylistRequest {
  string id = 1;
  string userId = 2;
  string name = 3;
  string description = 4;
  bool isPublic = 5;
  bool updateName = 6;
  bool updateDescription = 7;
  bool updateIsPublic = 8;
}

message DeletePlaylistRequest {
  string id = 1;
  string userId = 2;
}

message PlaylistSongRequest {
  string playlistId = 1;
  string songId = 2;
  string userId = 3;
}

message DeleteResult {
  bool ok = 1;
}

service PlaylistService {
  rpc MyPlaylists(UserIdRequest) returns (PlaylistPage);
  rpc PublicPlaylists(ListPlaylistsRequest) returns (PlaylistPage);
  rpc GetPlaylist(PlaylistIdRequest) returns (Playlist);
  rpc CreatePlaylist(CreatePlaylistRequest) returns (PlaylistSummary);
  rpc UpdatePlaylist(UpdatePlaylistRequest) returns (PlaylistSummary);
  rpc DeletePlaylist(DeletePlaylistRequest) returns (DeleteResult);
  rpc AddSongToPlaylist(PlaylistSongRequest) returns (Playlist);
  rpc RemoveSongFromPlaylist(PlaylistSongRequest) returns (Playlist);
}
```

### 3.6 Xay dung user-service

- Tao file `"/services/user-service/src/server.js"` va viet code:

```js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../shared/db.js";
import { mapUser } from "../../shared/mappers.js";
import {
  createGrpcServer,
  grpc,
  grpcError,
  handleGrpc,
  loadProto
} from "../../shared/grpc.js";

const proto = loadProto("user.proto");

function createToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

const implementation = {
  register(call, callback) {
    handleGrpc(callback, async () => {
      const fullName = String(call.request.fullName || "").trim();
      const email = String(call.request.email || "").trim().toLowerCase();
      const password = String(call.request.password || "");

      if (!fullName || !email || password.length < 6) {
        throw grpcError(grpc.status.INVALID_ARGUMENT, "Invalid register input");
      }

      const existed = await db("users").where({ email }).first();
      if (existed) {
        throw grpcError(grpc.status.ALREADY_EXISTS, "Email already exists");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [user] = await db("users")
        .insert({ full_name: fullName, email, password_hash: passwordHash })
        .returning("*");

      return {
        user: mapUser(user),
        token: createToken(user)
      };
    });
  },

  login(call, callback) {
    handleGrpc(callback, async () => {
      const email = String(call.request.email || "").trim().toLowerCase();
      const password = String(call.request.password || "");

      const user = await db("users").where({ email }).first();
      if (!user) {
        throw grpcError(grpc.status.UNAUTHENTICATED, "Invalid email or password");
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        throw grpcError(grpc.status.UNAUTHENTICATED, "Invalid email or password");
      }

      return {
        user: mapUser(user),
        token: createToken(user)
      };
    });
  },

  verifyToken(call, callback) {
    handleGrpc(callback, async () => {
      const token = String(call.request.token || "");
      if (!token) {
        throw grpcError(grpc.status.UNAUTHENTICATED, "Missing token");
      }

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        throw grpcError(grpc.status.UNAUTHENTICATED, "Invalid token");
      }

      const user = await db("users").where({ id: payload.sub }).first();
      if (!user) {
        throw grpcError(grpc.status.UNAUTHENTICATED, "User not found");
      }

      return mapUser(user);
    });
  },

  getMe(call, callback) {
    handleGrpc(callback, async () => {
      const user = await db("users").where({ id: call.request.id }).first();
      if (!user) {
        throw grpcError(grpc.status.NOT_FOUND, "User not found");
      }

      return mapUser(user);
    });
  },

  logout(call, callback) {
    callback(null, {});
  }
};

createGrpcServer(proto.UserService.service, implementation, process.env.USER_GRPC_URL);
```

### 3.7 Xay dung song-service

- Tao file `"/services/song-service/src/server.js"` va viet code:

```js
import { db } from "../../shared/db.js";
import { mapSong } from "../../shared/mappers.js";
import {
  createGrpcServer,
  grpc,
  grpcError,
  handleGrpc,
  loadProto
} from "../../shared/grpc.js";

const proto = loadProto("song.proto");

function normalizePaging(request) {
  const page = Math.max(1, Number(request.page || 1));
  const limit = Math.min(50, Math.max(1, Number(request.limit || 10)));
  return { page, limit, offset: (page - 1) * limit };
}

const implementation = {
  listSongs(call, callback) {
    handleGrpc(callback, async () => {
      const { page, limit, offset } = normalizePaging(call.request);

      const [{ count }] = await db("songs").count({ count: "*" });
      const total = Number(count);
      const items = await db("songs")
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);

      return {
        items: items.map(mapSong),
        pageInfo: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    });
  },

  getSong(call, callback) {
    handleGrpc(callback, async () => {
      const song = await db("songs").where({ id: call.request.id }).first();
      if (!song) {
        throw grpcError(grpc.status.NOT_FOUND, "Song not found");
      }

      return mapSong(song);
    });
  }
};

createGrpcServer(proto.SongService.service, implementation, process.env.SONG_GRPC_URL);
```

### 3.8 Xay dung playlist-service

- Tao file `"/services/playlist-service/src/server.js"` va viet code:

```js
import { db } from "../../shared/db.js";
import { mapPlaylist, mapPlaylistSummary, mapSong } from "../../shared/mappers.js";
import {
  createGrpcServer,
  grpc,
  grpcError,
  handleGrpc,
  loadProto
} from "../../shared/grpc.js";

const proto = loadProto("playlist.proto");

function requireUserId(userId) {
  if (!userId) {
    throw grpcError(grpc.status.UNAUTHENTICATED, "Authentication required");
  }
}

function normalizePaging(request) {
  const page = Math.max(1, Number(request.page || 1));
  const limit = Math.min(50, Math.max(1, Number(request.limit || 10)));
  return { page, limit, offset: (page - 1) * limit };
}

async function findPlaylist(id) {
  const playlist = await db("playlists").where({ id }).first();
  if (!playlist) {
    throw grpcError(grpc.status.NOT_FOUND, "Playlist not found");
  }
  return playlist;
}

async function requirePlaylistOwner(id, userId) {
  requireUserId(userId);
  const playlist = await findPlaylist(id);

  if (playlist.user_id !== userId) {
    throw grpcError(grpc.status.PERMISSION_DENIED, "Only owner can manage this playlist");
  }

  return playlist;
}

async function playlistWithSongs(playlist) {
  const songs = await db("playlist_songs as ps")
    .join("songs as s", "s.id", "ps.song_id")
    .where("ps.playlist_id", playlist.id)
    .orderBy("ps.order_number", "asc")
    .select("s.*");

  return mapPlaylist(playlist, songs.map(mapSong));
}

const implementation = {
  myPlaylists(call, callback) {
    handleGrpc(callback, async () => {
      requireUserId(call.request.userId);

      const items = await db("playlists")
        .where({ user_id: call.request.userId })
        .orderBy("created_at", "desc");

      return {
        items: items.map(mapPlaylistSummary),
        pageInfo: {
          page: 1,
          limit: items.length,
          total: items.length,
          totalPages: 1
        }
      };
    });
  },

  publicPlaylists(call, callback) {
    handleGrpc(callback, async () => {
      const { page, limit, offset } = normalizePaging(call.request);
      const [{ count }] = await db("playlists").where({ is_public: true }).count({ count: "*" });
      const total = Number(count);

      const items = await db("playlists")
        .where({ is_public: true })
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);

      return {
        items: items.map(mapPlaylistSummary),
        pageInfo: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    });
  },

  getPlaylist(call, callback) {
    handleGrpc(callback, async () => {
      const playlist = await findPlaylist(call.request.id);

      if (!playlist.is_public && playlist.user_id !== call.request.userId) {
        throw grpcError(grpc.status.PERMISSION_DENIED, "Private playlist");
      }

      return playlistWithSongs(playlist);
    });
  },

  createPlaylist(call, callback) {
    handleGrpc(callback, async () => {
      requireUserId(call.request.userId);

      const name = String(call.request.name || "").trim();
      if (!name) {
        throw grpcError(grpc.status.INVALID_ARGUMENT, "Playlist name is required");
      }

      const [playlist] = await db("playlists")
        .insert({
          user_id: call.request.userId,
          name,
          description: call.request.description || null,
          is_public: Boolean(call.request.isPublic)
        })
        .returning("*");

      return mapPlaylistSummary(playlist);
    });
  },

  updatePlaylist(call, callback) {
    handleGrpc(callback, async () => {
      const playlist = await requirePlaylistOwner(call.request.id, call.request.userId);

      const patch = {};
      if (call.request.updateName) {
        const name = String(call.request.name || "").trim();
        if (!name) {
          throw grpcError(grpc.status.INVALID_ARGUMENT, "Playlist name cannot be empty");
        }
        patch.name = name;
      }
      if (call.request.updateDescription) {
        patch.description = call.request.description || null;
      }
      if (call.request.updateIsPublic) {
        patch.is_public = Boolean(call.request.isPublic);
      }

      if (Object.keys(patch).length === 0) {
        return mapPlaylistSummary(playlist);
      }

      const [updated] = await db("playlists")
        .where({ id: playlist.id })
        .update(patch)
        .returning("*");

      return mapPlaylistSummary(updated);
    });
  },

  deletePlaylist(call, callback) {
    handleGrpc(callback, async () => {
      await requirePlaylistOwner(call.request.id, call.request.userId);
      await db("playlists").where({ id: call.request.id }).del();
      return { ok: true };
    });
  },

  addSongToPlaylist(call, callback) {
    handleGrpc(callback, async () => {
      const playlist = await requirePlaylistOwner(call.request.playlistId, call.request.userId);

      const song = await db("songs").where({ id: call.request.songId }).first();
      if (!song) {
        throw grpcError(grpc.status.NOT_FOUND, "Song not found");
      }

      const existed = await db("playlist_songs")
        .where({ playlist_id: playlist.id, song_id: song.id })
        .first();

      if (!existed) {
        const maxRow = await db("playlist_songs")
          .where({ playlist_id: playlist.id })
          .max({ max: "order_number" })
          .first();

        await db("playlist_songs").insert({
          playlist_id: playlist.id,
          song_id: song.id,
          order_number: Number(maxRow.max || 0) + 1
        });
      }

      return playlistWithSongs(playlist);
    });
  },

  removeSongFromPlaylist(call, callback) {
    handleGrpc(callback, async () => {
      const playlist = await requirePlaylistOwner(call.request.playlistId, call.request.userId);

      await db("playlist_songs")
        .where({ playlist_id: playlist.id, song_id: call.request.songId })
        .del();

      return playlistWithSongs(playlist);
    });
  }
};

createGrpcServer(proto.PlaylistService.service, implementation, process.env.PLAYLIST_GRPC_URL);
```

### 3.9 Xay dung GraphQL API server

- Tao file `"/services/api-server/src/grpcClients.js"` va viet code:

```js
import { grpc, loadProto } from "../../shared/grpc.js";

const userProto = loadProto("user.proto");
const songProto = loadProto("song.proto");
const playlistProto = loadProto("playlist.proto");

export const userClient = new userProto.UserService(
  process.env.USER_GRPC_URL,
  grpc.credentials.createInsecure()
);

export const songClient = new songProto.SongService(
  process.env.SONG_GRPC_URL,
  grpc.credentials.createInsecure()
);

export const playlistClient = new playlistProto.PlaylistService(
  process.env.PLAYLIST_GRPC_URL,
  grpc.credentials.createInsecure()
);

export function callGrpc(client, method, payload = {}) {
  return new Promise((resolve, reject) => {
    client[method](payload, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}
```

- Tao file `"/services/api-server/src/schema.js"` va viet code:

```js
export const typeDefs = `#graphql
  type User {
    id: ID!
    fullName: String!
    email: String!
    createdAt: String!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type Song {
    id: ID!
    title: String!
    artist: String!
    durationSeconds: Int!
    genre: String!
    audioUrl: String!
    createdAt: String!
  }

  type PageInfo {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  type SongPage {
    items: [Song!]!
    pageInfo: PageInfo!
  }

  type PlaylistSummary {
    id: ID!
    userId: ID!
    name: String!
    description: String
    isPublic: Boolean!
    createdAt: String!
  }

  type Playlist {
    id: ID!
    userId: ID!
    name: String!
    description: String
    isPublic: Boolean!
    createdAt: String!
    songs: [Song!]!
  }

  type PlaylistPage {
    items: [PlaylistSummary!]!
    pageInfo: PageInfo!
  }

  type Query {
    me: User
    songs(page: Int, limit: Int): SongPage!
    song(id: ID!): Song
    myPlaylists: [PlaylistSummary!]!
    playlist(id: ID!): Playlist
    publicPlaylists(page: Int, limit: Int): PlaylistPage!
  }

  type Mutation {
    register(fullName: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!
    createPlaylist(
      name: String!
      description: String
      isPublic: Boolean!
    ): PlaylistSummary!
    updatePlaylist(
      id: ID!
      name: String
      description: String
      isPublic: Boolean
    ): PlaylistSummary!
    deletePlaylist(id: ID!): Boolean!
    addSongToPlaylist(playlistId: ID!, songId: ID!): Playlist!
    removeSongFromPlaylist(playlistId: ID!, songId: ID!): Playlist!
  }
`;
```

- Tao file `"/services/api-server/src/resolvers.js"` va viet code:

```js
import { GraphQLError } from "graphql";
import { callGrpc, playlistClient, songClient, userClient } from "./grpcClients.js";

function toGraphQLError(error) {
  return new GraphQLError(error.details || error.message || "Internal server error", {
    extensions: {
      code: error.code || "INTERNAL_SERVER_ERROR"
    }
  });
}

async function grpcCall(client, method, payload) {
  try {
    return await callGrpc(client, method, payload);
  } catch (error) {
    throw toGraphQLError(error);
  }
}

function requireAuth(context) {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" }
    });
  }

  return context.user;
}

export const resolvers = {
  Query: {
    me: async (_, __, context) => context.user,

    songs: async (_, args) =>
      grpcCall(songClient, "listSongs", {
        page: args.page || 1,
        limit: args.limit || 10
      }),

    song: async (_, args) => grpcCall(songClient, "getSong", { id: args.id }),

    myPlaylists: async (_, __, context) => {
      const user = requireAuth(context);
      const result = await grpcCall(playlistClient, "myPlaylists", { userId: user.id });
      return result.items;
    },

    playlist: async (_, args, context) =>
      grpcCall(playlistClient, "getPlaylist", {
        id: args.id,
        userId: context.user?.id || ""
      }),

    publicPlaylists: async (_, args) =>
      grpcCall(playlistClient, "publicPlaylists", {
        page: args.page || 1,
        limit: args.limit || 10
      })
  },

  Mutation: {
    register: async (_, args) => grpcCall(userClient, "register", args),

    login: async (_, args) => grpcCall(userClient, "login", args),

    logout: async () => true,

    createPlaylist: async (_, args, context) => {
      const user = requireAuth(context);

      return grpcCall(playlistClient, "createPlaylist", {
        userId: user.id,
        name: args.name,
        description: args.description || "",
        isPublic: args.isPublic
      });
    },

    updatePlaylist: async (_, args, context) => {
      const user = requireAuth(context);

      return grpcCall(playlistClient, "updatePlaylist", {
        id: args.id,
        userId: user.id,
        name: args.name || "",
        description: args.description || "",
        isPublic: args.isPublic || false,
        updateName: Object.prototype.hasOwnProperty.call(args, "name"),
        updateDescription: Object.prototype.hasOwnProperty.call(args, "description"),
        updateIsPublic: Object.prototype.hasOwnProperty.call(args, "isPublic")
      });
    },

    deletePlaylist: async (_, args, context) => {
      const user = requireAuth(context);
      const result = await grpcCall(playlistClient, "deletePlaylist", {
        id: args.id,
        userId: user.id
      });

      return result.ok;
    },

    addSongToPlaylist: async (_, args, context) => {
      const user = requireAuth(context);

      return grpcCall(playlistClient, "addSongToPlaylist", {
        playlistId: args.playlistId,
        songId: args.songId,
        userId: user.id
      });
    },

    removeSongFromPlaylist: async (_, args, context) => {
      const user = requireAuth(context);

      return grpcCall(playlistClient, "removeSongFromPlaylist", {
        playlistId: args.playlistId,
        songId: args.songId,
        userId: user.id
      });
    }
  }
};
```

- Tao file `"/services/api-server/src/server.js"` va viet code:

```js
import "../../shared/env.js";
import cors from "cors";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { callGrpc, userClient } from "./grpcClients.js";
import { resolvers } from "./resolvers.js";
import { typeDefs } from "./schema.js";

async function buildContext(req) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    return { user: null, token: null };
  }

  try {
    const user = await callGrpc(userClient, "verifyToken", { token });
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers
});

await server.start();

app.use(
  "/graphql",
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => buildContext(req)
  })
);

const port = Number(process.env.PORT || 23162);
app.listen(port, () => {
  console.log(`GraphQL API ready at http://localhost:${port}/graphql`);
});
```

### 3.10 Chay he thong

- Dam bao Docker Desktop/Docker Engine dang chay.

- Chay database:

```bash
docker compose up -d
```

- Cai package neu chua cai:

```bash
npm install
```

- Chay migration:

```bash
npm run migrate
```

- Chay seed data:

```bash
npm run seed
```

- Chay toan bo he thong:

```bash
npm run dev
```

- Khi thanh cong, terminal se co cac dong tuong tu:

```text
gRPC server listening at localhost:50051
gRPC server listening at localhost:50052
gRPC server listening at localhost:50053
GraphQL API ready at http://localhost:23162/graphql
```

## 4. Chay server va kich ban kiem thu

Mo Altair GraphQL Client hoac Postman, truy cap endpoint:

```text
http://localhost:23162/graphql
```

### 4.1 Kiem thu kham pha bai hat

- Gui query lay danh sach bai hat:

```graphql
query Songs {
  songs(page: 1, limit: 3) {
    items {
      id
      title
      artist
      durationSeconds
      genre
      audioUrl
      createdAt
    }
    pageInfo {
      page
      limit
      total
      totalPages
    }
  }
}
```

Ket qua mong doi:

```json
{
  "data": {
    "songs": {
      "items": [
        {
          "id": "...",
          "title": "...",
          "artist": "..."
        }
      ],
      "pageInfo": {
        "page": 1,
        "limit": 3,
        "total": 6,
        "totalPages": 2
      }
    }
  }
}
```

- Copy `id` cua 1 bai hat, sau do test xem chi tiet:

```graphql
query SongDetail($id: ID!) {
  song(id: $id) {
    id
    title
    artist
    durationSeconds
    genre
    audioUrl
    createdAt
  }
}
```

Variables:

```json
{
  "id": "SONG_ID_COPY_TU_QUERY_TREN"
}
```

### 4.2 Kiem thu dang ky va dang nhap

- Dang ky user moi:

```graphql
mutation Register {
  register(
    fullName: "Nguyen Van A"
    email: "vana@example.com"
    password: "123456"
  ) {
    token
    user {
      id
      fullName
      email
      createdAt
    }
  }
}
```

- Dang nhap bang tai khoan seed:

```graphql
mutation Login {
  login(email: "demo@media.test", password: "123456") {
    token
    user {
      id
      fullName
      email
      createdAt
    }
  }
}
```

- Copy token tra ve, gan vao HTTP Header:

```text
Authorization: Bearer TOKEN_DANG_NHAP
```

- Test lay thong tin ca nhan:

```graphql
query Me {
  me {
    id
    fullName
    email
    createdAt
  }
}
```

Ket qua mong doi: tra ve dung user dang dang nhap va khong co truong `password_hash`.

### 4.3 Kiem thu tao playlist ca nhan

- Tao playlist rieng tu:

```graphql
mutation CreatePlaylist {
  createPlaylist(
    name: "Nhac hoc bai"
    description: "Danh sach bai hat nghe khi hoc bai"
    isPublic: false
  ) {
    id
    userId
    name
    description
    isPublic
    createdAt
  }
}
```

- Tao playlist cong khai:

```graphql
mutation CreatePublicPlaylist {
  createPlaylist(
    name: "Nhac cong khai"
    description: "Playlist moi nguoi co the xem"
    isPublic: true
  ) {
    id
    userId
    name
    description
    isPublic
    createdAt
  }
}
```

- Lay danh sach playlist cua user dang dang nhap:

```graphql
query MyPlaylists {
  myPlaylists {
    id
    userId
    name
    description
    isPublic
    createdAt
  }
}
```

### 4.4 Kiem thu cap nhat va xoa playlist

- Cap nhat playlist:

```graphql
mutation UpdatePlaylist($id: ID!) {
  updatePlaylist(
    id: $id
    name: "Nhac hoc bai cap nhat"
    description: "Da cap nhat mo ta"
    isPublic: true
  ) {
    id
    name
    description
    isPublic
  }
}
```

Variables:

```json
{
  "id": "PLAYLIST_ID_CUA_BAN"
}
```

- Xoa playlist:

```graphql
mutation DeletePlaylist($id: ID!) {
  deletePlaylist(id: $id)
}
```

Variables:

```json
{
  "id": "PLAYLIST_ID_CUA_BAN"
}
```

Ket qua mong doi:

```json
{
  "data": {
    "deletePlaylist": true
  }
}
```

### 4.5 Kiem thu them va xoa bai hat trong playlist

- Lay danh sach bai hat de copy `songId`:

```graphql
query SongsForPlaylist {
  songs(page: 1, limit: 10) {
    items {
      id
      title
      artist
    }
  }
}
```

- Them bai hat vao playlist:

```graphql
mutation AddSongToPlaylist($playlistId: ID!, $songId: ID!) {
  addSongToPlaylist(playlistId: $playlistId, songId: $songId) {
    id
    name
    songs {
      id
      title
      artist
    }
  }
}
```

Variables:

```json
{
  "playlistId": "PLAYLIST_ID_CUA_BAN",
  "songId": "SONG_ID_CAN_THEM"
}
```

- Xoa bai hat khoi playlist:

```graphql
mutation RemoveSongFromPlaylist($playlistId: ID!, $songId: ID!) {
  removeSongFromPlaylist(playlistId: $playlistId, songId: $songId) {
    id
    name
    songs {
      id
      title
      artist
    }
  }
}
```

Variables:

```json
{
  "playlistId": "PLAYLIST_ID_CUA_BAN",
  "songId": "SONG_ID_CAN_XOA"
}
```

### 4.6 Kiem thu phan quyen playlist public/private

- Lay danh sach playlist cong khai, khong can dang nhap:

```graphql
query PublicPlaylists {
  publicPlaylists(page: 1, limit: 10) {
    items {
      id
      userId
      name
      description
      isPublic
      createdAt
    }
    pageInfo {
      page
      limit
      total
      totalPages
    }
  }
}
```

- Xem chi tiet playlist cong khai:

```graphql
query PublicPlaylistDetail($id: ID!) {
  playlist(id: $id) {
    id
    name
    isPublic
    songs {
      id
      title
      artist
    }
  }
}
```

Variables:

```json
{
  "id": "PUBLIC_PLAYLIST_ID"
}
```

- Kich ban loi can test:
  - Bo header `Authorization`.
  - Goi `myPlaylists` hoac `createPlaylist`.
  - Ket qua mong doi: GraphQL tra ve loi `Authentication required`.

```graphql
query MyPlaylistsWithoutToken {
  myPlaylists {
    id
    name
  }
}
```

## 5. Checklist nop bai

- API server dung port `23162`.
- Endpoint duy nhat la `http://localhost:23162/graphql`.
- Database Docker dung image `postgres:15-alpine`.
- Database host port dung `15432`.
- Co file `.env`.
- Co folder `"/protos"` chua cac file `.proto`.
- Co folder `"/services"` chua cac service con.
- Chay duoc:

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

- Co chuc nang:
  - `register`, `login`, `logout`, `me`.
  - `songs`, `song`.
  - `createPlaylist`, `updatePlaylist`, `deletePlaylist`, `myPlaylists`.
  - `addSongToPlaylist`, `removeSongFromPlaylist`.
  - `publicPlaylists`, `playlist` co phan quyen public/private.
- Khong tra ve `password_hash` trong GraphQL.
- Quay video lien tuc, khong cat ghep, chat luong toi thieu 1920x1080, FPS 24.
