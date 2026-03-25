-- V9: Add ON DELETE CASCADE to template_blocks and template_exercises FKs
-- This ensures that when a template or block is physically deleted,
-- its children are cleaned up automatically by the DB.

-- template_blocks.template_id → routine_templates.id
ALTER TABLE template_blocks
    DROP CONSTRAINT template_blocks_template_id_fkey,
    ADD CONSTRAINT template_blocks_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES routine_templates(id) ON DELETE CASCADE;

-- template_exercises.block_id → template_blocks.id
ALTER TABLE template_exercises
    DROP CONSTRAINT template_exercises_block_id_fkey,
    ADD CONSTRAINT template_exercises_block_id_fkey
        FOREIGN KEY (block_id) REFERENCES template_blocks(id) ON DELETE CASCADE;
