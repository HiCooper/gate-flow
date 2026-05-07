package com.gateflow.readmore.controller;

import com.gateflow.readmore.domain.entity.Book;
import com.gateflow.readmore.domain.entity.Chapter;
import com.gateflow.readmore.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public Map<String, Object> listBooks(
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category) {
        List<Book> records = bookService.listBooks(current, size, category);
        return Map.of("records", records, "total", records.size());
    }

    @GetMapping("/{id}")
    public Book getBook(@PathVariable Long id) {
        return bookService.getBookById(id);
    }

    @GetMapping("/{id}/chapters")
    public List<Chapter> getChapters(@PathVariable Long id) {
        return bookService.getChaptersByBookId(id);
    }

    @GetMapping("/{id}/chapters/{chapterId}")
    public Chapter getChapter(@PathVariable Long id, @PathVariable Long chapterId) {
        return bookService.getChapter(id, chapterId);
    }
}
