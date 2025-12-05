# Руководство по админ-панели и работе с изображениями

## Навигация категорий

Навигация категорий исправлена. Теперь:
- При выборе категории появляется кнопка "← Назад к всем товарам"
- Кнопка автоматически скрывается при просмотре всех товаров
- Можно вернуться к "Все товары" в любой момент

## Административная панель

### Доступ
- URL: `http://localhost:8080/admin.html`
- Пароль по умолчанию: `admin123`
- Пароль можно изменить в `application.properties`: `admin.password=ваш_пароль`

### Функционал

#### Управление категориями
- ✅ Создание новых категорий
- ✅ Редактирование существующих категорий
- ✅ Удаление категорий

#### Управление товарами
- ✅ Добавление новых товаров
- ✅ Редактирование товаров
- ✅ Удаление товаров
- ✅ Загрузка изображений для товаров

## Работа с изображениями

### Загрузка изображений

#### Пример кода загрузки (JavaScript)

```javascript
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    fetch(`${ADMIN_API}/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.url) {
            // Сохранить URL изображения
            document.getElementById('productImagePath').value = data.url;
            // Показать превью
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${data.url}" alt="Preview">`;
        }
    })
    .catch(error => {
        console.error('Error uploading image:', error);
    });
}
```

#### Пример кода на бэкенде (Java)

```java
@PostMapping("/upload")
public ResponseEntity<Map<String, String>> uploadImage(
    @RequestParam("file") MultipartFile file) {
    
    // Генерация уникального имени файла
    String filename = UUID.randomUUID().toString() + 
        getFileExtension(file.getOriginalFilename());
    
    // Сохранение файла
    Path uploadsPath = Paths.get("uploads");
    if (!Files.exists(uploadsPath)) {
        Files.createDirectories(uploadsPath);
    }
    
    Path filePath = uploadsPath.resolve(filename);
    Files.write(filePath, file.getBytes());
    
    // Возврат URL
    String imageUrl = "/uploads/" + filename;
    Map<String, String> response = new HashMap<>();
    response.put("url", imageUrl);
    return ResponseEntity.ok(response);
}
```

### Сохранение пути в базе данных

#### Модель Product

```java
@Entity
@Table(name = "products")
public class Product {
    // ... другие поля
    
    @Column(name = "image_path")
    private String imagePath;
    
    // ... геттеры и сеттеры
}
```

#### Сохранение товара с изображением

```java
Product product = new Product();
product.setName("Название товара");
product.setPrice(1000.0);
product.setImagePath("/uploads/abc123.jpg"); // Путь к изображению
productRepository.save(product);
```

### Отображение изображений на странице

#### Пример HTML

```html
<div class="product-image">
    <img src="${product.imagePath || 'images/placeholder.svg'}" 
         alt="${product.name}"
         onerror="this.src='images/placeholder.svg';">
</div>
```

#### Пример JavaScript

```javascript
function renderProducts() {
    productsGrid.innerHTML = products.map(product => {
        const imageUrl = product.imagePath || 'images/placeholder.svg';
        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${imageUrl}" 
                         alt="${product.name}"
                         onerror="this.src='images/placeholder.svg';">
                </div>
                <!-- остальной контент -->
            </div>
        `;
    }).join('');
}
```

### Структура файлов

```
project/
├── uploads/              # Загруженные изображения (создается автоматически)
│   └── uuid-filename.jpg
├── src/main/resources/
│   └── static/
│       └── images/
│           └── placeholder.svg  # Заглушка для товаров без изображения
```

### Настройка путей

В `application.properties`:
```properties
# Статические ресурсы (включая uploads)
spring.web.resources.static-locations=classpath:/static/,file:uploads/

# Настройки загрузки файлов
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

В `WebConfig.java`:
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadsPath = Paths.get("uploads").toAbsolutePath().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadsPath + "/");
    }
}
```

## API Endpoints

### Админ-панель

- `POST /api/admin/login` - Вход в админ-панель
- `GET /api/admin/categories` - Получить все категории
- `POST /api/admin/categories` - Создать категорию
- `PUT /api/admin/categories/{id}` - Обновить категорию
- `DELETE /api/admin/categories/{id}` - Удалить категорию
- `GET /api/admin/products` - Получить все товары
- `POST /api/admin/products` - Создать товар
- `PUT /api/admin/products/{id}` - Обновить товар
- `DELETE /api/admin/products/{id}` - Удалить товар
- `POST /api/admin/upload` - Загрузить изображение

## Примеры использования

### Создание товара с изображением через API

```javascript
const product = {
    name: "Новый товар",
    description: "Описание товара",
    price: 1999.99,
    quantity: 10,
    category: { id: 1, name: "Электроника" },
    imagePath: "/uploads/abc123.jpg"
};

fetch('/api/admin/products', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(product)
});
```

### Загрузка и сохранение изображения

```javascript
// 1. Загрузить изображение
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData
});
const { url } = await uploadResponse.json();

// 2. Сохранить товар с путем к изображению
const product = {
    name: "Товар",
    imagePath: url, // Использовать URL из ответа
    // ... другие поля
};

await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
});
```

## Безопасность

⚠️ **Важно**: Текущая реализация использует простую аутентификацию по паролю. Для production рекомендуется:
- Использовать Spring Security
- Хранить пароли в зашифрованном виде
- Добавить сессии и токены
- Ограничить доступ к админ-панели по IP

## Поддержка

При возникновении проблем:
1. Проверьте, что папка `uploads` создана и доступна для записи
2. Убедитесь, что размер файла не превышает 10MB
3. Проверьте консоль браузера (F12) на наличие ошибок
4. Проверьте логи сервера

