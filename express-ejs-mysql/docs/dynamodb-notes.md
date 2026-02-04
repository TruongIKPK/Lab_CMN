# Kien truc du lieu & DynamoDB Notes

## 1. Bang & thuoc tinh chinh

| Table | Partition Key | Thuoc tinh chinh |
| --- | --- | --- |
| `Users` | `userId` | `username`, `password` (hash), `role` (`admin`/`staff`), `createdAt` |
| `Categories` | `categoryId` | `name`, `description`, `createdAt` |
| `Products` | `id` | `name`, `price`, `quantity`, `categoryId`, `imageUrl`, `isDeleted`, `createdAt`, `updatedAt`, `deletedAt` |
| `ProductLogs` | `logId` | `productId`, `action` (`CREATE/UPDATE/DELETE`), `userId`, `time` |

> Business rules:
> - Moi san pham thuoc dung 01 category (tham chieu bang `categoryId`).
> - Xoa category **khong** xoa san pham (chi mat metadata, san pham van giu `categoryId`).
> - Products ap dung **Soft Delete** bang co `isDeleted`; danh sach bo qua item co `isDeleted = true`.

## 2. Vi sao DynamoDB khong JOIN nhu SQL?

DynamoDB la CSDL key-value/NoSQL phan tan, du lieu duoc chia shard theo partition key. Dich vu chi dam bao truy van rat nhanh dua tren khoa (`GetItem`, `Query`). De JOIN nhu SQL, he thong phai:

1. Doc nhieu partition dong thoi.
2. Giu lock/transaction tren nhieu item.
3. Tra ve ket qua tong hop dua tren khoa ngoai.

Dieu nay mau thuan voi muc tieu O(1) va kha nang scale tuyen tinh cua DynamoDB. Vi vay DynamoDB **khong ho tro JOIN**; thay vao do ta denormalize du lieu hoac join o tang service (vi du: lay Products roi map sang Categories ben service).

## 3. Query vs. Scan

| Tieu chi | `Query` | `Scan` |
| --- | --- | --- |
| Dieu kien | Bat buoc co `partition key` (optional `sort key`). | Doc *toan bo item* trong bang, dieu kien chi la `FilterExpression` o client. |
| Hieu nang | O(1) voi so partition huu han. | O(n) theo tong so item/1MB moi request. |
| Chi phi | Chi doc dung partition => it RCU/WCU. | Phai doc toan bang nen RCU/WCU tang manh. |
| Truong hop dung | Tra cuu user theo `username` (qua GSI), lay order theo `userId`. | Bao cao toan bang, loc phuc tap khong dua tren key. |

Trong he thong nay:

- `Users` co GSI tren `username` nen login dung `Query` => nhanh va tiet kiem.
- Danh sach san pham can loc theo category/price/search. Chua co sort-key phu hop nen tam thoi dung `Scan + Filter`. Khi du lieu lon nen them GSI hoac cache de giam chi phi.
- `Scan` dat vi DynamoDB phai doc tung partition, copy ve client roi moi loc; du chi can 5 item van tinh RCU theo byte da doc.

## 4. Soft Delete & Audit

- Xoa san pham = cap nhat `isDeleted = true` + `deletedAt`. Service luon loai nhung ban ghi nay khoi view.
- Moi thao tac `CREATE/UPDATE/DELETE` ghi log vao `ProductLogs` kem `userId` de audit.

## 5. Phan lop kien truc

```
Routes -> Controllers -> Services -> Repositories -> DynamoDB
                         -> Middlewares (auth/role)
```

- **Routes** chi khai bao duong dan + middleware.
- **Controllers** xu ly request/response, khong goi DynamoDB truc tiep.
- **Services** chua nghiep vu: upload S3, soft delete, inventory status, audit log.
- **Repositories** wrap cac lenh DynamoDB (`Get`, `Put`, `Update`, `Scan`).
- **Middlewares** quan ly session & role (staff = read-only, admin = CRUD).
