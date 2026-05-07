package com.gateflow.readmore.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gateflow.readmore.domain.entity.Book;
import com.gateflow.readmore.domain.entity.Chapter;
import com.gateflow.readmore.mapper.BookMapper;
import com.gateflow.readmore.mapper.ChapterMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookMapper bookMapper;
    private final ChapterMapper chapterMapper;

    public List<Book> listBooks(int current, int size, String category) {
        LambdaQueryWrapper<Book> wrapper = new LambdaQueryWrapper<>();
        if (category != null && !category.isEmpty()) {
            wrapper.eq(Book::getCategory, category);
        }
        wrapper.orderByDesc(Book::getCreatedAt);
        wrapper.last("LIMIT " + size + " OFFSET " + (current - 1) * size);
        return bookMapper.selectList(wrapper);
    }

    public Book getBookById(Long id) {
        return bookMapper.selectById(id);
    }

    public List<Chapter> getChaptersByBookId(Long bookId) {
        LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Chapter::getBookId, bookId).orderByAsc(Chapter::getSortOrder);
        return chapterMapper.selectList(wrapper);
    }

    public Chapter getChapter(Long bookId, Long chapterId) {
        LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Chapter::getId, chapterId).eq(Chapter::getBookId, bookId);
        return chapterMapper.selectOne(wrapper);
    }
}
