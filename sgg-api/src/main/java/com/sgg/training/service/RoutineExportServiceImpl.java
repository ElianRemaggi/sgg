package com.sgg.training.service;

import com.sgg.training.dto.RoutineTemplateDetailDto;
import com.sgg.training.dto.TemplateBlockDto;
import com.sgg.training.dto.TemplateExerciseDto;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Comparator;
import java.util.List;

@Service
public class RoutineExportServiceImpl implements RoutineExportService {

    private static final Logger log = LoggerFactory.getLogger(RoutineExportServiceImpl.class);

    private static final String[] COL_HEADERS = {
        "Ejercicio", "Series", "Reps", "Descanso (s)", "Notas"
    };

    // ── Excel ────────────────────────────────────────────────────────────────

    @Override
    public byte[] toXlsx(RoutineTemplateDetailDto dto) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet(sanitizeSheetName(dto.name()));

            CellStyle titleStyle = buildTitleStyle(wb);
            CellStyle blockStyle = buildBlockStyle(wb);
            CellStyle headerStyle = buildHeaderStyle(wb);
            CellStyle bodyStyle  = buildBodyStyle(wb);

            int rowIdx = 0;

            // ── Título de la plantilla ──
            Row titleRow = sheet.createRow(rowIdx++);
            titleRow.setHeightInPoints(22);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(dto.name());
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, COL_HEADERS.length - 1));

            // ── Descripción (si existe) ──
            if (dto.description() != null && !dto.description().isBlank()) {
                Row descRow = sheet.createRow(rowIdx++);
                Cell descCell = descRow.createCell(0);
                descCell.setCellValue(dto.description());
                CellStyle descStyle = wb.createCellStyle();
                descStyle.setWrapText(true);
                Font descFont = wb.createFont();
                descFont.setItalic(true);
                descStyle.setFont(descFont);
                descCell.setCellStyle(descStyle);
                sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, COL_HEADERS.length - 1));
            }

            rowIdx++; // fila en blanco

            // ── Bloques y ejercicios ──
            List<TemplateBlockDto> blocks = dto.blocks().stream()
                .sorted(Comparator.comparingInt(b -> (b.sortOrder() != null ? b.sortOrder() : 0)))
                .toList();

            for (TemplateBlockDto block : blocks) {
                // Encabezado de bloque
                Row blockRow = sheet.createRow(rowIdx++);
                blockRow.setHeightInPoints(16);
                Cell blockCell = blockRow.createCell(0);
                blockCell.setCellValue("Día " + block.dayNumber() + " — " + block.name());
                blockCell.setCellStyle(blockStyle);
                sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, COL_HEADERS.length - 1));

                // Encabezados de columna
                Row headerRow = sheet.createRow(rowIdx++);
                for (int i = 0; i < COL_HEADERS.length; i++) {
                    Cell c = headerRow.createCell(i);
                    c.setCellValue(COL_HEADERS[i]);
                    c.setCellStyle(headerStyle);
                }

                // Filas de ejercicios
                List<TemplateExerciseDto> exercises = block.exercises().stream()
                    .sorted(Comparator.comparingInt(e -> (e.sortOrder() != null ? e.sortOrder() : 0)))
                    .toList();

                for (TemplateExerciseDto ex : exercises) {
                    Row exRow = sheet.createRow(rowIdx++);
                    exRow.createCell(0).setCellValue(ex.name());
                    exRow.createCell(1).setCellValue(ex.sets() != null ? ex.sets() : 0);
                    exRow.createCell(2).setCellValue(ex.reps() != null ? ex.reps() : "");
                    exRow.createCell(3).setCellValue(ex.restSeconds() != null ? ex.restSeconds() : 0);
                    exRow.createCell(4).setCellValue(ex.notes() != null ? ex.notes() : "");
                    for (int i = 0; i < COL_HEADERS.length; i++) {
                        exRow.getCell(i).setCellStyle(bodyStyle);
                    }
                }

                rowIdx++; // espacio entre bloques
            }

            // Autoajuste de ancho (columna 0 = nombre ejercicio más ancha)
            sheet.setColumnWidth(0, 40 * 256);
            sheet.setColumnWidth(1, 10 * 256);
            sheet.setColumnWidth(2, 12 * 256);
            sheet.setColumnWidth(3, 14 * 256);
            sheet.setColumnWidth(4, 35 * 256);

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Error generando Excel para template '{}'", dto.name(), e);
            throw new RuntimeException("Error al generar el archivo Excel", e);
        }
    }

    // ── CSV ──────────────────────────────────────────────────────────────────

    @Override
    public byte[] toCsv(RoutineTemplateDetailDto dto) {
        StringBuilder sb = new StringBuilder();

        // BOM UTF-8 para que Excel abra con acentos correctos
        sb.append('﻿');

        // Encabezado
        sb.append("Día,Bloque,Ejercicio,Series,Reps,Descanso (s),Notas\n");

        List<TemplateBlockDto> blocks = dto.blocks().stream()
            .sorted(Comparator.comparingInt(b -> (b.sortOrder() != null ? b.sortOrder() : 0)))
            .toList();

        for (TemplateBlockDto block : blocks) {
            String dayCol    = csvEscape(String.valueOf(block.dayNumber()));
            String blockCol  = csvEscape(block.name());

            List<TemplateExerciseDto> exercises = block.exercises().stream()
                .sorted(Comparator.comparingInt(e -> (e.sortOrder() != null ? e.sortOrder() : 0)))
                .toList();

            for (TemplateExerciseDto ex : exercises) {
                sb.append(dayCol).append(',')
                  .append(blockCol).append(',')
                  .append(csvEscape(ex.name())).append(',')
                  .append(ex.sets() != null ? ex.sets() : "").append(',')
                  .append(csvEscape(ex.reps() != null ? ex.reps() : "")).append(',')
                  .append(ex.restSeconds() != null ? ex.restSeconds() : "").append(',')
                  .append(csvEscape(ex.notes() != null ? ex.notes() : "")).append('\n');
            }
        }

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** RFC 4180: si el campo contiene coma, comilla o salto de línea, encerrarlo en comillas y duplicar comillas internas. */
    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    /** Elimina caracteres inválidos para nombres de hoja Excel (máx 31 chars). */
    private String sanitizeSheetName(String name) {
        if (name == null) return "Rutina";
        String sanitized = name.replaceAll("[\\[\\]\\*\\?/\\\\:]", "").strip();
        return sanitized.length() > 31 ? sanitized.substring(0, 31) : sanitized;
    }

    private CellStyle buildTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        style.setFont(font);
        return style;
    }

    private CellStyle buildBlockStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle buildHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setBorderBottom(BorderStyle.THIN);
        style.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle buildBodyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setWrapText(false);
        return style;
    }
}
