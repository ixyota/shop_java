package com.yota.shop.config;

import com.yota.shop.model.Category;
import com.yota.shop.model.Product;
import com.yota.shop.repository.CategoryRepository;
import com.yota.shop.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public DataInitializer(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            // Создаем категории
            Category electronics = new Category(null, "Электроника");
            Category clothing = new Category(null, "Одежда");
            Category books = new Category(null, "Книги");
            Category home = new Category(null, "Дом и сад");
            Category sports = new Category(null, "Спорт");

            List<Category> categories = Arrays.asList(electronics, clothing, books, home, sports);
            categoryRepository.saveAll(categories);

            // Создаем товары
            List<Product> products = Arrays.asList(
                new Product(null, "Смартфон Samsung Galaxy", 
                    "Современный смартфон с отличной камерой и производительностью", 
                    29999.0, 15, electronics),
                new Product(null, "Ноутбук ASUS", 
                    "Мощный ноутбук для работы и игр", 
                    59999.0, 8, electronics),
                new Product(null, "Наушники Sony", 
                    "Беспроводные наушники с шумоподавлением", 
                    8999.0, 25, electronics),
                new Product(null, "Футболка хлопковая", 
                    "Удобная футболка из 100% хлопка", 
                    1999.0, 50, clothing),
                new Product(null, "Джинсы классические", 
                    "Классические джинсы синего цвета", 
                    3999.0, 30, clothing),
                new Product(null, "Кроссовки Nike", 
                    "Спортивные кроссовки для бега", 
                    5999.0, 20, clothing),
                new Product(null, "Война и мир", 
                    "Классический роман Льва Толстого", 
                    899.0, 40, books),
                new Product(null, "Гарри Поттер", 
                    "Полное собрание книг о Гарри Поттере", 
                    2999.0, 15, books),
                new Product(null, "Диван угловой", 
                    "Удобный угловой диван для гостиной", 
                    29999.0, 5, home),
                new Product(null, "Кофемашина", 
                    "Автоматическая кофемашина с капучинатором", 
                    19999.0, 10, home),
                new Product(null, "Велосипед горный", 
                    "Горный велосипед для активного отдыха", 
                    24999.0, 7, sports),
                new Product(null, "Гантели набор", 
                    "Набор разборных гантелей 2x20кг", 
                    4999.0, 12, sports)
            );

            productRepository.saveAll(products);
        }
    }
}

