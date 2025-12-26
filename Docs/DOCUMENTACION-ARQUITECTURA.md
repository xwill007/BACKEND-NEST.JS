# 📚 Documentación de Arquitectura - NEST.js Backend API

## 🎯 Descripción General del Proyecto

API REST desarrollada con **NestJS** (framework de Node.js) que implementa un sistema CRUD para gestión de gatos, razas, usuarios y clientes, con autenticación JWT y control de roles. Utiliza **TypeORM** como ORM y **MySQL 8.0** como base de datos.

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas

```
src/
├── auth/                   # Módulo de autenticación
│   ├── decorators/         # Decoradores personalizados (@Auth, @Roles)
│   ├── dto/               # Data Transfer Objects (Login, Register)
│   ├── guard/             # Guards de autenticación y roles
│   ├── auth.controller.ts # Controlador REST (register, login, profile)
│   ├── auth.service.ts    # Lógica de negocio de autenticación
│   └── auth.module.ts     # Módulo de autenticación
├── breeds/                 # Módulo de razas de gatos
│   ├── dto/               # DTOs (CreateBreed, UpdateBreed)
│   ├── entities/          # Entidad Breed
│   ├── breeds.controller.ts
│   ├── breeds.service.ts
│   └── breeds.module.ts
├── cats/                   # Módulo de gatos
│   ├── dto/               # DTOs (CreateCat, UpdateCat)
│   ├── entities/          # Entidad Cat
│   ├── cats.controller.ts
│   ├── cats.service.ts
│   └── cats.module.ts
├── users/                  # Módulo de usuarios
│   ├── dto/               # DTOs de usuarios
│   ├── entities/          # Entidad User
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── clientes/              # Módulo de clientes
│   ├── dto/
│   ├── entities/
│   ├── clientes.controller.ts
│   ├── clientes.service.ts
│   └── clientes.module.ts
├── common/                 # Recursos compartidos
│   ├── decorators/        # @ActiveUser (obtiene usuario del request)
│   ├── enums/             # Role (USER, ADMIN)
│   └── interfaces/        # UserActiveInterface
├── app.module.ts          # Módulo raíz
└── main.ts                # Punto de entrada de la aplicación
```

---

## 🔄 Patrón de Arquitectura: Modular (NestJS)

NestJS sigue una arquitectura modular inspirada en Angular. Cada módulo encapsula una funcionalidad completa:

### Componentes por Módulo:

1. **Module** (`*.module.ts`)
   - Configura el módulo
   - Define imports, providers, controllers y exports
   - Inyecta dependencias

2. **Controller** (`*.controller.ts`)
   - Maneja las peticiones HTTP (endpoints REST)
   - Define rutas con decoradores (@Get, @Post, @Patch, @Delete)
   - Valida datos de entrada con DTOs
   - Aplica guards de autenticación (@Auth)

3. **Service** (`*.service.ts`)
   - Contiene la lógica de negocio
   - Interactúa con la base de datos vía TypeORM
   - Es inyectable en controllers y otros services

4. **Entity** (`entities/*.entity.ts`)
   - Representa una tabla en la base de datos
   - Define columnas y relaciones con decoradores de TypeORM

5. **DTO** (Data Transfer Object) (`dto/*.dto.ts`)
   - Define la estructura de datos para requests
   - Aplica validaciones con class-validator
   - Protege contra datos no deseados

---

## 🗄️ Base de Datos: MySQL

### Configuración de Conexión

**Archivo:** `src/app.module.ts`

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  port: 3307,               // Puerto expuesto por Docker
  username: 'user_crud',
  password: 'root',
  database: 'db_crud',
  autoLoadEntities: true,   // Carga automática de entidades
  synchronize: true,        // ⚠️ Solo para desarrollo
})
```

### Docker Compose

**Archivo:** `docker-compose.yml`

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: mysql_db
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: db_crud
      MYSQL_USER: user_crud
      MYSQL_PASSWORD: root
    ports:
      - "3307:3306"          # Host:Contenedor
    volumes:
      - ./mysql:/var/lib/mysql  # Persistencia de datos
```

---

## 📊 Modelo de Datos y Relaciones

### Diagrama de Relaciones

```
┌─────────────┐         ┌─────────────┐
│    User     │         │   Breed     │
├─────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)     │
│ name        │         │ name        │
│ email (UQ)  │         └──────┬──────┘
│ password    │                │ 1
│ role (ENUM) │                │
│ deletedAt   │                │ OneToMany
└──────┬──────┘                │
       │ 1                     │
       │                       │
       │ ManyToOne             │
       │                       │
       └───────────┐   ┌───────┘
                   │   │
              ┌────▼───▼────┐
              │     Cat     │
              ├─────────────┤
              │ id (PK)     │
              │ name        │
              │ age         │
              │ breed (FK)  │ ──► Breed
              │ userEmail(FK)│ ──► User
              │ deletedAt   │
              └─────────────┘
```

### Entidades Detalladas

#### 1. **User** (Usuarios del sistema)

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false, select: false })  // No se retorna por defecto
  password: string;

  @Column({ type: 'enum', default: Role.USER, enum: Role })
  role: Role;  // 'user' | 'admin'

  @DeleteDateColumn()  // Soft delete
  deletedAt: Date;
}
```

**Roles disponibles:**
- `USER`: Puede gestionar sus propios gatos
- `ADMIN`: Puede gestionar todos los recursos (breeds, users, etc.)

#### 2. **Breed** (Razas de gatos)

```typescript
@Entity()
export class Breed {
  @Column({ primary: true, generated: true })
  id: number;

  @Column({ length: 500 })
  name: string;

  @OneToMany(() => Cat, (cat) => cat.breed)
  cats: Cat[];  // Relación inversa
}
```

#### 3. **Cat** (Gatos)

```typescript
@Entity()
export class Cat {
  @Column({ primary: true, generated: true })
  id: number;

  @Column()
  name: string;

  @Column()
  age: number;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Breed, (breed) => breed.id, {
    eager: true,  // Carga automática de la raza
  })
  breed: Breed;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userEmail', referencedColumnName: 'email' })
  user: User;

  @Column()
  userEmail: string;
}
```

**Características:**
- **Soft Delete**: Los registros no se eliminan físicamente, solo se marcan con `deletedAt`
- **Eager Loading**: La raza se carga automáticamente al consultar un gato
- **Validación de ownership**: Solo el dueño o admin puede modificar/eliminar

#### 4. **Cliente** (Módulo de clientes)

Similar estructura CRUD para gestión de clientes (implementación específica del negocio).

---

## 🔐 Sistema de Autenticación y Autorización

### Flujo de Autenticación

```
1. Register/Login
   └─► AuthController
       └─► AuthService
           ├─► Valida credenciales
           ├─► Hashea contraseña (bcryptjs)
           └─► Genera JWT token
               └─► Retorna token al cliente

2. Request con Token
   └─► Headers: { Authorization: "Bearer <token>" }
       └─► AuthGuard (valida token JWT)
           └─► Decodifica payload { email, role }
               └─► RolesGuard (valida rol requerido)
                   └─► Permite o rechaza acceso
```

### Componentes de Seguridad

#### 1. **JWT (JSON Web Token)**

**Configuración:** `auth.module.ts`

```typescript
JwtModule.register({
  global: true,
  secret: jwtConstants.secret,
  signOptions: { expiresIn: '1d' },  // Token válido por 1 día
})
```

**Payload del token:**
```json
{
  "email": "user@example.com",
  "role": "admin"
}
```

#### 2. **Guards** (Guardias de acceso)

##### AuthGuard (`auth/guard/auth.guard.ts`)

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Extrae token del header Authorization
    // 2. Verifica y decodifica JWT
    // 3. Busca usuario en BD
    // 4. Adjunta usuario al request
    // 5. Permite o rechaza acceso
  }
}
```

##### RolesGuard (`auth/guard/roles.guard.ts`)

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 1. Obtiene rol requerido del metadata
    // 2. Compara con rol del usuario en request
    // 3. Permite si coincide o es ADMIN
  }
}
```

#### 3. **Decoradores Personalizados**

##### @Auth(role) - Protege endpoints

```typescript
@Auth(Role.ADMIN)
@Controller('breeds')
export class BreedsController {
  // Solo usuarios con rol ADMIN pueden acceder
}
```

##### @ActiveUser() - Obtiene usuario actual

```typescript
@Get('profile')
@Auth(Role.USER)
profile(@ActiveUser() user: UserActiveInterface) {
  // Acceso directo al usuario autenticado
  return user;
}
```

---

## 🔄 Flujo de una Petición HTTP

### Ejemplo: Crear un Gato

```
1. Cliente POST /api/v1/cats
   Body: { name: "Michi", age: 3, breed: "Persa" }
   Headers: { Authorization: "Bearer token..." }
   
2. main.ts → Global Prefix: /api/v1
   
3. CatsController.create()
   ├─► @Auth(Role.USER) decorator
   │   ├─► AuthGuard: valida token JWT
   │   └─► RolesGuard: valida rol USER
   │
   ├─► ValidationPipe (global)
   │   └─► Valida CreateCatDto con class-validator
   │
   └─► @ActiveUser() extrae usuario del request
   
4. CatsService.create()
   ├─► Valida que la raza exista (validateBreed)
   ├─► Asocia gato con usuario autenticado
   └─► Guarda en BD con TypeORM
   
5. Respuesta 201 Created
   Body: { id, name, age, breed: {...}, userEmail }
```

---

## 📦 Inyección de Dependencias

NestJS usa un patrón de **Dependency Injection** similar a Angular:

### Ejemplo: CatsModule

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Cat]),  // Registra repositorio de Cat
    BreedsModule,                      // Importa módulo de Breeds
  ],
  controllers: [CatsController],       // Controladores del módulo
  providers: [CatsService],            // Servicios inyectables
})
export class CatsModule {}
```

### Relación entre Módulos

```
AppModule (raíz)
├─► AuthModule
│   ├─► imports: [UsersModule, JwtModule]
│   └─► exports: []
│
├─► CatsModule
│   ├─► imports: [BreedsModule]
│   └─► exports: []
│
├─► BreedsModule
│   ├─► imports: [TypeOrmModule]
│   └─► exports: [BreedsService]  ← Usado por CatsModule
│
├─► UsersModule
│   ├─► imports: [TypeOrmModule]
│   └─► exports: [UsersService]   ← Usado por AuthModule
│
└─► ClientesModule
    ├─► imports: [TypeOrmModule]
    └─► exports: []
```

---

## 🛡️ Validaciones y DTOs

### Ejemplo: CreateCatDto

```typescript
export class CreateCatDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsInt()
  @IsPositive()
  age: number;

  @IsString()
  @IsOptional()
  breed?: string;  // Nombre de la raza (no ID)
}
```

### ValidationPipe Global

**Archivo:** `main.ts`

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Remueve propiedades no definidas en DTO
    forbidNonWhitelisted: true, // Rechaza requests con propiedades extra
    transform: true,            // Transforma tipos automáticamente
  }),
);
```

---

## 🚀 Scripts de NPM

```json
{
  "start-dev": "nest start --watch",      // Desarrollo con hot-reload
  "start:prod": "node dist/main",         // Producción
  "build": "nest build",                  // Compila TypeScript
  "test": "jest",                         // Tests unitarios
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

---

## 🔧 Configuración de Inicio

### main.ts - Bootstrap de la Aplicación

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');
  
  // Validación global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Escucha en puerto 3000
  await app.listen(3000);
  
  // Muestra URLs de conexión
  console.log('📍 Local: http://localhost:3000/api/v1');
  console.log('🌐 Red: http://[IP]:3000/api/v1');
}
```

---

## 🌐 Endpoints de la API

### Auth (Autenticación)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Registrar usuario | No |
| POST | `/api/v1/auth/login` | Iniciar sesión | No |
| GET | `/api/v1/auth/profile` | Obtener perfil | USER |

### Cats (Gatos)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/cats` | Crear gato | USER |
| GET | `/api/v1/cats` | Listar todos los gatos | USER |
| GET | `/api/v1/cats/:id` | Obtener gato por ID | USER |
| PATCH | `/api/v1/cats/:id` | Actualizar gato | USER* |
| DELETE | `/api/v1/cats/:id` | Eliminar gato (soft) | USER* |

*Solo el dueño o ADMIN

### Breeds (Razas)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/breeds` | Crear raza | ADMIN |
| GET | `/api/v1/breeds` | Listar razas | ADMIN |
| GET | `/api/v1/breeds/:id` | Obtener raza | ADMIN |
| PATCH | `/api/v1/breeds/:id` | Actualizar raza | ADMIN |
| DELETE | `/api/v1/breeds/:id` | Eliminar raza | ADMIN |

### Users (Usuarios)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/users` | Crear usuario | - |
| GET | `/api/v1/users` | Listar usuarios | - |
| GET | `/api/v1/users/:id` | Obtener usuario | - |
| PATCH | `/api/v1/users/:id` | Actualizar usuario | - |
| DELETE | `/api/v1/users/:id` | Eliminar usuario | - |

---

## 🔍 Características Avanzadas

### 1. **Soft Delete**

Los registros no se eliminan físicamente, solo se marcan con una fecha:

```typescript
@DeleteDateColumn()
deletedAt: Date;
```

TypeORM automáticamente excluye registros con `deletedAt` en las consultas.

### 2. **Eager Loading**

La relación `breed` se carga automáticamente:

```typescript
@ManyToOne(() => Breed, (breed) => breed.id, {
  eager: true,  // Carga automática
})
breed: Breed;
```

### 3. **Transform Pipe**

Limpia espacios en blanco de strings:

```typescript
@Transform(({ value }) => value.trim())
@IsString()
password: string;
```

### 4. **Validación de Ownership**

Solo el dueño o admin puede modificar recursos:

```typescript
private validateOwnership(cat: Cat, user: UserActiveInterface) {
  if (user.role !== Role.ADMIN && cat.userEmail !== user.email) {
    throw new UnauthorizedException();
  }
}
```

---

## 🐳 Docker y Despliegue

### Comandos Docker

```bash
# Iniciar MySQL
docker compose up -d

# Ver contenedores activos
docker ps

# Detener MySQL
docker compose down

# Acceder a MySQL CLI
docker exec -it mysql_db mysql -u user_crud -p
```

### Estructura de Volúmenes

```
./mysql/  ← Datos persistentes de MySQL
```

---

## 📊 Mejores Prácticas Implementadas

✅ **Separación de responsabilidades** (Controller → Service → Repository)  
✅ **DTOs** para validación de entrada  
✅ **Guards** para autenticación y autorización  
✅ **Soft Delete** en lugar de borrado físico  
✅ **Hashing de contraseñas** con bcryptjs  
✅ **JWT** para autenticación stateless  
✅ **ValidationPipe** global para validaciones automáticas  
✅ **TypeORM** para abstracción de base de datos  
✅ **Docker** para entorno de desarrollo consistente  
✅ **Roles** para control de acceso granular  

---

## ⚠️ Consideraciones de Seguridad

### Para Producción:

1. **Desactivar synchronize:**
   ```typescript
   synchronize: false,  // Usar migraciones en producción
   ```

2. **Variables de entorno:**
   ```typescript
   // Usar ConfigModule de NestJS
   host: process.env.DB_HOST,
   password: process.env.DB_PASSWORD,
   ```

3. **HTTPS obligatorio**

4. **Rate limiting** para prevenir ataques de fuerza bruta

5. **CORS** configurado correctamente

6. **Helmet** para headers de seguridad

---

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run start-dev

# Compilar
npm run build

# Producción
npm run start:prod

# Tests
npm run test

# Ver logs de Docker
docker logs mysql_db

# Backup de BD
docker exec mysql_db mysqldump -u user_crud -proot db_crud > backup.sql
```

---

## 🎓 Recursos y Referencias

- **NestJS Docs:** https://docs.nestjs.com
- **TypeORM Docs:** https://typeorm.io
- **MySQL 8.0 Docs:** https://dev.mysql.com/doc/
- **JWT:** https://jwt.io

---

## 👥 Contacto y Soporte

**Desarrollador:** Santiago Sierra  
**Repositorio:** xwill007/BACKEND-NEST.JS  
**Branch:** main  

---

**Última actualización:** 26 de diciembre de 2025
