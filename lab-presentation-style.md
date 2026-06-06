# Mau trinh bay bai lab theo 4 file Lab 1-4

File nay ghi lai cach trinh bay can bat chuoc khi nhan de moi. Muc tieu khong phai copy noi dung 4 lab, ma la giu dung thu tu, van phong va muc do chi tiet de co the copy lam theo.

## 1. Khung chung

Moi bai nen co 3 phan lon:

```md
# Ten bai / Lab X

## 1. Muc tieu

## 2. Yeu cau

## 3. Huong dan
```

Trong 4 file goc, phan `Muc tieu` va `Yeu cau` ngan gon, con phan `Huong dan` chi tiet tung thao tac. Neu de moi la mot bai thuc hanh, uu tien viet day du trong `Huong dan`.

## 2. Cach viet tung phan

### 2.1 Muc tieu

Viet 1-3 gach dau dong, noi ro cong nghe va muc dich chinh.

Vi du mau:

```md
## 1. Muc tieu

- Xay dung he thong voi kien truc Microservices.
- Tich hop cac service thong qua RabbitMQ/gRPC/GraphQL.
- Kiem thu cac chuc nang chinh bang client hoac cau lenh tuong ung.
```

### 2.2 Yeu cau

Viet theo kieu mo ta bai tap, neu co domain thi liet ke entity, truong du lieu, quan he va chuc nang can co.

Mau:

```md
## 2. Yeu cau

- Dua tren ket qua bai tap tuan truoc, tai cau truc he thong de ...
- He thong can co cac thanh phan:
  - Service A: quan ly ...
  - Service B: xu ly ...
  - Gateway: tiep nhan request va dieu phoi ...
- Can cung cap cac chuc nang:
  - Tao ...
  - Lay danh sach ...
  - Cap nhat ...
  - Xoa ...
  - Kiem thu tinh huong ...
```

Neu bai moi lam tu dau, thay cau "Dua tren ket qua bai tap tuan truoc" bang "Xay dung project moi ...".

### 2.3 Huong dan

Phan nay phai di theo thu tu nguoi lam thao tac tren may:

1. Khoi tao project hoac clone project cu.
2. Cai package.
3. Tao/cap nhat file cau hinh: `package.json`, `.env`, `docker-compose.yml`, `Dockerfile`.
4. Tao cau truc thu muc.
5. Viet code theo tung file, tu tang du lieu den service/gateway/controller/resolver.
6. Chay database/message broker/infra.
7. Chay migration/seed neu co.
8. Chay server/worker.
9. Test bang request/query/mutation/cau lenh.

Mau tong quat:

````md
## 3. Huong dan

### 3.1 Khoi tao project

- Chuyen terminal ve thu muc hien hanh la `<root>` (dat ten tuy y).
- Neu lam tu bai truoc, clone/copy project tuan truoc ra thu muc moi.
- Cai dat package can thiet:

```bash
npm i ...
```

- Tao/cap nhat file `"/docker-compose.yml"` nhu sau:

```yml
...
```

- Chay infra phuc vu qua trinh dev:

```bash
docker compose up -d
```

- Tao cau truc thu muc:

```bash
mkdir -p ...
```
````

## 3. Quy tac trinh bay file va code

Moi file nen co dung 1 cum:

````md
- Tao file `"/duong-dan/file.ext"` va viet code:

```js
...
```
````

Hoac neu file da co san:

````md
- Cap nhat file `"/duong-dan/file.ext"` nhu sau:

```js
...
```
````

Thu tu file nen sap xep nhu sau:

1. File goc/cau hinh chung: `package.json`, `.env`, `.env.docker`, `docker-compose.yml`, `Dockerfile`.
2. Database: migration, seed, repository/model.
3. Shared/common: error helper, config, logger, client ket noi.
4. Service rieng: proto/schema, service logic, server, worker/consumer.
5. Gateway/API: schema/typeDefs, resolvers/controllers/routes, auth middleware.
6. Test/client: query, mutation, request mau, lenh curl, collection.

Khi co nhieu service, trinh bay theo service:

```md
### 3.2 Xay dung student-service

- Cap nhat `"/services/student-service/.env"`:
- Tao file `"/services/student-service/src/db.js"`:
- Tao file `"/services/student-service/src/server.js"`:
- Chay thu service:

### 3.3 Xay dung course-service

...

### 3.4 Xay dung gateway

...
```

## 4. Cach viet lenh chay

Trong cac lab goc, lenh quan trong duoc tach rieng va de rat de thay. Trong Markdown, dung code block.

Mau:

````md
- Chay lenh sau de mo DB server cho qua trinh dev:

```bash
docker compose up -d
```

- Chay migration va seed:

```bash
npm run migrate
npm run seed
```

- Chay server:

```bash
npm start
```

- Mo them terminal va chay worker:

```bash
npm run consumer:enrollment
```
````

Neu can nhieu terminal, ghi ro:

```md
- Terminal 1: chay `student-service`.
- Terminal 2: chay `course-service`.
- Terminal 3: chay `gateway`.
- Terminal 4: chay worker/consumer neu co.
```

## 5. Cach viet phan test

Cuoi bai phai co muc rieng, thuong la:

```md
### 3.x Chay server va kich ban kiem thu
```

Noi dung test nen gom:

1. Chay thanh phan nao truoc.
2. Dung cong cu nao de test: Altair GraphQL Client, Postman, curl, browser, CLI.
3. Request/query/mutation mau.
4. Ket qua mong doi.
5. Neu co workflow bat dong bo, mo ta cach kiem tra sau khi event duoc xu ly.

Mau:

````md
### 3.5 Chay server va kich ban kiem thu

- Chay database va cac service:

```bash
docker compose up -d
npm start
```

- Mo Altair GraphQL Client va truy cap endpoint:

```text
http://localhost:4000/graphql
```

- Kich ban 1: tao du lieu moi.

```graphql
mutation {
  ...
}
```

Ket qua mong doi:

```json
{
  "data": {
    ...
  }
}
```

- Kich ban 2: lay danh sach de xac nhan du lieu da duoc tao.

```graphql
query {
  ...
}
```

- Kich ban 3: kiem tra truong hop loi.
  - Gui input khong hop le.
  - Ket qua mong doi: server tra ve error message phu hop, khong lam dung server.
````

## 6. Van phong can bat chuoc

Dung van phong huong dan truc tiep:

- "Chuyen terminal ve thu muc ..."
- "Thuc hien lenh ..."
- "Tao file ... va viet code:"
- "Cap nhat file ... nhu sau:"
- "Chay thu server va test ..."
- "Mo them terminal va chay ..."
- "Luu y ..."
- "Hoan thanh cac phan con lai" chi dung khi de yeu cau sinh vien tu lam tiep, khong dung cho cau tra loi ma nguoi dung can copy lam theo.

Neu nguoi dung yeu cau "chi tiet cang tot", khong viet "tu lam" ma phai viet het file, het lenh, het test.

## 7. Mau tra loi khi nhan de moi

Khi nguoi dung gui de moi, tra loi theo form nay:

```md
# Huong dan trien khai [ten bai]

## 1. Muc tieu

- ...

## 2. Yeu cau

- ...

## 3. Huong dan

### 3.1 Khoi tao project

- ...

### 3.2 Cau hinh moi truong va package

- ...

### 3.3 Xay dung database / migration / seed

- ...

### 3.4 Xay dung cac service / module chinh

- ...

### 3.5 Xay dung gateway / API / UI neu co

- ...

### 3.6 Chay server va kich ban kiem thu

- ...
```

Neu de la Node.js backend/microservice, thu tu uu tien:

1. `docker-compose.yml`
2. `.env`
3. `package.json`
4. cau truc thu muc
5. migration/seed
6. config/db/client
7. model/repository
8. service/business logic
9. API/resolver/controller
10. server bootstrap
11. lenh chay
12. test

## 8. Dieu can lam khi nhan file de moi

Khi nhan de moi, can:

1. Doc de va rut ra cong nghe, entity, chuc nang, rang buoc.
2. Quyet dinh bai lam tu dau hay dua tren lab truoc.
3. Viet Markdown theo dung khung tren.
4. Neu co code, moi file phai co duong dan va code day du.
5. Neu co test, moi test phai co input va ket qua mong doi.
6. Neu de mo ho, dua ra gia dinh ro rang thay vi hoi lai qua nhieu.
