# akkyomap

## Backend Local MySQL

로컬 실행 기본 datasource는 MySQL `akkyomap` 데이터베이스입니다.

```sql
CREATE DATABASE akkyomap
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER 'akkyomap'@'localhost' IDENTIFIED BY 'local_password';

GRANT ALL PRIVILEGES ON akkyomap.* TO 'akkyomap'@'localhost';

FLUSH PRIVILEGES;
```

비밀번호는 Git에 커밋하지 않고 환경변수로 전달합니다.

```bash
cd backend
DB_USERNAME=akkyomap DB_PASSWORD=local_password ./gradlew bootRun
```

DB URL까지 지정해야 하는 경우:

```bash
DB_URL='jdbc:mysql://localhost:3306/akkyomap?serverTimezone=Asia/Seoul&characterEncoding=UTF-8' \
DB_USERNAME=akkyomap \
DB_PASSWORD=local_password \
./gradlew bootRun
```

테스트는 `test` profile과 H2 메모리 DB를 사용하므로 로컬 MySQL 서버 없이 실행됩니다.

```bash
cd backend
./gradlew test
```
