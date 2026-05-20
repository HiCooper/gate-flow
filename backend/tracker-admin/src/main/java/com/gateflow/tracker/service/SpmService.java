package com.gateflow.tracker.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gateflow.tracker.domain.dto.CreateSpmRequest;
import com.gateflow.tracker.domain.dto.SpmVO;
import com.gateflow.tracker.domain.entity.TrackerSpm;
import com.gateflow.tracker.exception.BizException;
import com.gateflow.tracker.exception.ErrorCode;
import com.gateflow.tracker.repository.TrackerSpmMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpmService {

    private final TrackerSpmMapper spmMapper;

    private static final String[] LEVEL_NAMES = {"SPMA", "SPMB", "SPMC", "SPMD"};

    /**
     * 获取所有SPM（扁平列表）
     */
    public List<SpmVO> listSpms() {
        LambdaQueryWrapper<TrackerSpm> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(TrackerSpm::getLevel)
               .orderByAsc(TrackerSpm::getSortOrder)
               .orderByDesc(TrackerSpm::getCreatedAt);
        List<TrackerSpm> list = spmMapper.selectList(wrapper);
        return list.stream().map(this::toVO).collect(Collectors.toList());
    }

    /**
     * 按层级获取SPM列表
     */
    public List<SpmVO> listByLevel(Integer level) {
        LambdaQueryWrapper<TrackerSpm> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(level != null, TrackerSpm::getLevel, level);
        wrapper.orderByAsc(TrackerSpm::getSortOrder)
               .orderByDesc(TrackerSpm::getCreatedAt);
        return spmMapper.selectList(wrapper).stream().map(this::toVO).collect(Collectors.toList());
    }

    /**
     * 搜索 SPM（支持编码模糊搜索和父级筛选）
     * @param level 层级（可选）
     * @param keyword 编码关键字（可选，模糊匹配）
     * @param rootId 顶级父级 ID（筛选该 SPM 及其所有后代）
     */
    public List<SpmVO> searchSpms(Integer level, String keyword, Long rootId) {
        // 如果指定了 rootId，先获取其所有后代 ID（包括自己）
        Set<Long> descendantIds = null;
        if (rootId != null) {
            descendantIds = getDescendantIds(rootId);
            descendantIds.add(rootId);
        }

        LambdaQueryWrapper<TrackerSpm> wrapper = new LambdaQueryWrapper<>();

        // 按层级筛选
        if (level != null) {
            wrapper.eq(TrackerSpm::getLevel, level);
        }

        // 编码模糊搜索
        if (keyword != null && !keyword.trim().isEmpty()) {
            wrapper.like(TrackerSpm::getSpmCode, keyword.trim());
        }

        // 顶级父级筛选
        if (descendantIds != null && !descendantIds.isEmpty()) {
            wrapper.in(TrackerSpm::getId, descendantIds);
        }

        wrapper.orderByAsc(TrackerSpm::getLevel)
               .orderByAsc(TrackerSpm::getSortOrder);

        return spmMapper.selectList(wrapper).stream().map(this::toVO).collect(Collectors.toList());
    }

    /**
     * 获取指定 SPM 的所有后代 ID（包括自己）
     */
    private Set<Long> getDescendantIds(Long rootId) {
        Set<Long> result = new HashSet<>();
        Queue<Long> queue = new LinkedList<>();
        queue.add(rootId);

        while (!queue.isEmpty()) {
            Long parentId = queue.poll();
            List<TrackerSpm> children = spmMapper.selectList(
                new LambdaQueryWrapper<TrackerSpm>().eq(TrackerSpm::getParentId, parentId)
            );
            for (TrackerSpm child : children) {
                result.add(child.getId());
                queue.add(child.getId());
            }
        }
        return result;
    }

    /**
     * 获取树形结构（只包含 level=0 的根节点及其子节点）
     */
    public List<SpmVO> listSpmTree() {
        List<TrackerSpm> allSpms = spmMapper.selectList(
            new LambdaQueryWrapper<TrackerSpm>()
                .orderByAsc(TrackerSpm::getLevel)
                .orderByAsc(TrackerSpm::getSortOrder)
        );

        // 按 parentId 分组
        Map<Long, List<TrackerSpm>> childrenMap = allSpms.stream()
                .filter(s -> s.getParentId() != null)
                .collect(Collectors.groupingBy(TrackerSpm::getParentId));

        // 找出根节点（level=0 或 parentId=null）
        List<SpmVO> roots = allSpms.stream()
                .filter(s -> s.getLevel() == 0 || s.getParentId() == null)
                .map(s -> buildTree(s, childrenMap))
                .collect(Collectors.toList());

        return roots;
    }

    private SpmVO buildTree(TrackerSpm spm, Map<Long, List<TrackerSpm>> childrenMap) {
        SpmVO vo = toVO(spm);
        List<TrackerSpm> children = childrenMap.get(spm.getId());
        if (children != null && !children.isEmpty()) {
            vo.setChildren(children.stream()
                    .map(c -> buildTree(c, childrenMap))
                    .collect(Collectors.toList()));
        }
        return vo;
    }

    /**
     * 获取子节点
     */
    public List<SpmVO> getChildren(Long parentId) {
        LambdaQueryWrapper<TrackerSpm> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(parentId != null, TrackerSpm::getParentId, parentId);
        wrapper.orderByAsc(TrackerSpm::getSortOrder);
        return spmMapper.selectList(wrapper).stream().map(this::toVO).collect(Collectors.toList());
    }

    /**
     * 获取可选的父级列表（只能选择比当前层级高的记录）
     */
    public List<SpmVO> getAvailableParents(Integer currentLevel) {
        // 只能选择 level < currentLevel 的记录
        LambdaQueryWrapper<TrackerSpm> wrapper = new LambdaQueryWrapper<>();
        wrapper.lt(currentLevel != null, TrackerSpm::getLevel, currentLevel);
        wrapper.orderByAsc(TrackerSpm::getLevel)
               .orderByAsc(TrackerSpm::getSortOrder);
        return spmMapper.selectList(wrapper).stream().map(this::toVO).collect(Collectors.toList());
    }

    /**
     * 检查是否有子节点
     */
    public boolean hasChildren(Long id) {
        return spmMapper.selectCount(
            new LambdaQueryWrapper<TrackerSpm>().eq(TrackerSpm::getParentId, id)
        ) > 0;
    }

    /**
     * 获取SPM详情
     */
    public SpmVO getSpmById(Long id) {
        TrackerSpm spm = spmMapper.selectById(id);
        if (spm == null) {
            throw new BizException(ErrorCode.SPM_NOT_FOUND, "SPM not found: " + id);
        }
        SpmVO vo = toVO(spm);
        // 设置父级名称
        if (spm.getParentId() != null) {
            TrackerSpm parent = spmMapper.selectById(spm.getParentId());
            if (parent != null) {
                vo.setParentName(parent.getSpmName());
            }
        }
        return vo;
    }

    /**
     * 获取 SPM 的完整面包屑路径（从根节点到当前节点）
     * 返回路径片段列表，每项包含 id, spmCode, spmName
     */
    public List<SpmVO> getBreadcrumb(Long id) {
        TrackerSpm spm = spmMapper.selectById(id);
        if (spm == null) {
            throw new BizException(ErrorCode.SPM_NOT_FOUND, "SPM not found: " + id);
        }

        List<SpmVO> breadcrumbs = new ArrayList<>();
        breadcrumbs.add(toVO(spm));

        // 向上遍历父节点
        Long parentId = spm.getParentId();
        while (parentId != null) {
            TrackerSpm parent = spmMapper.selectById(parentId);
            if (parent == null) break;
            breadcrumbs.add(0, toVO(parent)); // 插入到开头
            parentId = parent.getParentId();
        }

        return breadcrumbs;
    }

    @Transactional(rollbackFor = Exception.class)
    public SpmVO createSpm(CreateSpmRequest request) {
        // 校验层级关系
        validateHierarchy(request.getLevel(), request.getParentId());

        TrackerSpm spm = new TrackerSpm();
        spm.setSpmName(request.getSpmName());
        spm.setDescription(request.getDescription());
        spm.setStatus(request.getStatus() != null ? request.getStatus() : 1);
        spm.setLevel(request.getLevel());

        // 自动生成编码
        boolean isSplitSlot = Boolean.TRUE.equals(request.getIsSplitSlot());
        String spmCode = generateSpmCode(request.getLevel(), request.getParentId(), isSplitSlot);
        spm.setSpmCode(spmCode);

        // 设置 parent_id 和 path
        if (request.getLevel() > 0) {
            if (request.getParentId() == null) {
                throw new BizException(ErrorCode.PARAM_INVALID, LEVEL_NAMES[request.getLevel()] + " must have a parent");
            }
            spm.setParentId(request.getParentId());

            // 获取父级计算 path
            TrackerSpm parent = spmMapper.selectById(request.getParentId());
            spm.setPath(parent.getPath() + "_" + spmCode);
        } else {
            // level=0 时，path 就是自己的 code
            spm.setParentId(null);
            spm.setPath(spmCode);
        }

        spmMapper.insert(spm);
        log.info("Created SPM: id={}, code={}, level={}, path={}", spm.getId(), spm.getSpmCode(), spm.getLevel(), spm.getPath());
        return toVO(spm);
    }

    /**
     * 自动生成 SPM 编码
     * 规则: {LEVEL_PREFIX}_{6位随机小写字母}
     * - SPMA: a_xxxxxx
     * - SPMB: b_xxxxxx
     * - SPMC: c_xxxxxx
     * - SPMD: d_xxxxxx（分屏点位加 _x 后缀）
     */
    private String generateSpmCode(Integer level, Long parentId, boolean isSplitSlot) {
        String[] PREFIXES = {"a", "b", "c", "d"};

        // 生成 6 位随机小写字母
        String randomStr = generateRandomString(6);

        String code = PREFIXES[level] + "_" + randomStr;

        // SPMD 分屏点位添加 _x 后缀
        if (level == 3 && isSplitSlot) {
            code += "_x";
        }

        return code;
    }

    /**
     * 生成指定长度的随机小写字母字符串
     */
    private String generateRandomString(int length) {
        Random random = new Random();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append((char) ('a' + random.nextInt(26)));
        }
        return sb.toString();
    }

    @Transactional(rollbackFor = Exception.class)
    public SpmVO updateSpm(Long id, CreateSpmRequest request) {
        TrackerSpm spm = spmMapper.selectById(id);
        if (spm == null) {
            throw new BizException(ErrorCode.SPM_NOT_FOUND, "SPM not found: " + id);
        }

        // 允许修改 name, description, status
        if (request.getSpmName() != null) {
            spm.setSpmName(request.getSpmName());
        }
        if (request.getDescription() != null) {
            spm.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            spm.setStatus(request.getStatus());
        }

        // 注意：level 和 parentId 不允许修改（如果要修改，需要走 moveSpm 接口）
        spmMapper.updateById(spm);
        return toVO(spm);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteSpm(Long id) {
        TrackerSpm spm = spmMapper.selectById(id);
        if (spm == null) {
            throw new BizException(ErrorCode.SPM_NOT_FOUND, "SPM not found: " + id);
        }

        // 检查是否有子节点
        if (hasChildren(id)) {
            throw new BizException(ErrorCode.SPM_HAS_CHILDREN,
                    "Cannot delete " + LEVEL_NAMES[spm.getLevel()] + " with children. Please delete children first.");
        }

        spmMapper.deleteById(id);
        log.info("Deleted SPM: id={}, code={}", id, spm.getSpmCode());
    }

    @Transactional(rollbackFor = Exception.class)
    public void moveSpm(Long id, Long newParentId) {
        TrackerSpm spm = spmMapper.selectById(id);
        if (spm == null) {
            throw new BizException(ErrorCode.SPM_NOT_FOUND, "SPM not found: " + id);
        }

        // 校验目标父级的层级
        if (newParentId != null) {
            TrackerSpm newParent = spmMapper.selectById(newParentId);
            if (newParent == null) {
                throw new BizException(ErrorCode.SPM_NOT_FOUND, "Parent SPM not found: " + newParentId);
            }
            if (newParent.getLevel() != spm.getLevel() - 1) {
                throw new BizException(ErrorCode.PARAM_INVALID,
                        "Parent level must be " + (spm.getLevel() - 1) + " but got " + newParent.getLevel());
            }

            // 更新 path
            spm.setParentId(newParentId);
            spm.setPath(newParent.getPath() + "_" + spm.getSpmCode());
        } else {
            // 移动到根节点
            if (spm.getLevel() != 0) {
                throw new BizException(ErrorCode.PARAM_INVALID, "Only level 0 can move to root");
            }
            spm.setParentId(null);
            spm.setPath(spm.getSpmCode());
        }

        spmMapper.updateById(spm);
        // 递归更新子节点的 path
        updateChildrenPath(id, spm.getPath());
        log.info("Moved SPM: id={}, newParentId={}, newPath={}", id, newParentId, spm.getPath());
    }

    private void updateChildrenPath(Long parentId, String parentPath) {
        List<TrackerSpm> children = spmMapper.selectList(
            new LambdaQueryWrapper<TrackerSpm>().eq(TrackerSpm::getParentId, parentId)
        );
        for (TrackerSpm child : children) {
            child.setPath(parentPath + "_" + child.getSpmCode());
            spmMapper.updateById(child);
            updateChildrenPath(child.getId(), child.getPath());
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void sortSpm(Long id, Integer newOrder) {
        TrackerSpm spm = spmMapper.selectById(id);
        if (spm == null) {
            throw new BizException(ErrorCode.SPM_NOT_FOUND, "SPM not found: " + id);
        }
        spm.setSortOrder(newOrder);
        spmMapper.updateById(spm);
    }

    /**
     * 校验层级关系
     */
    private void validateHierarchy(Integer level, Long parentId) {
        if (level == null || level < 0 || level > 3) {
            throw new BizException(ErrorCode.PARAM_INVALID, "Level must be 0-3");
        }

        if (level == 0) {
            // SPMA 不能有父级
            if (parentId != null) {
                throw new BizException(ErrorCode.PARAM_INVALID, "SPMA cannot have a parent");
            }
        } else {
            // SPMB/SPMC/SPMD 必须有父级
            if (parentId == null) {
                throw new BizException(ErrorCode.PARAM_INVALID, LEVEL_NAMES[level] + " must have a parent");
            }

            // 父级必须存在
            TrackerSpm parent = spmMapper.selectById(parentId);
            if (parent == null) {
                throw new BizException(ErrorCode.SPM_NOT_FOUND, "Parent SPM not found: " + parentId);
            }

            // 父级层级必须比当前层级高 1
            if (parent.getLevel() != level - 1) {
                throw new BizException(ErrorCode.PARAM_INVALID,
                        "Parent level must be " + (level - 1) + " but is " + parent.getLevel());
            }
        }
    }

    private SpmVO toVO(TrackerSpm spm) {
        SpmVO vo = new SpmVO();
        vo.setId(spm.getId());
        vo.setSpmCode(spm.getSpmCode());
        vo.setSpmName(spm.getSpmName());
        vo.setDescription(spm.getDescription());
        vo.setStatus(spm.getStatus());
        vo.setCreatedAt(spm.getCreatedAt());
        vo.setUpdatedAt(spm.getUpdatedAt());
        // 层级字段
        vo.setLevel(spm.getLevel());
        vo.setParentId(spm.getParentId());
        vo.setPath(spm.getPath());
        vo.setSortOrder(spm.getSortOrder());
        return vo;
    }
}