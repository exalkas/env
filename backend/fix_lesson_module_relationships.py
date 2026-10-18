#!/usr/bin/env python3
"""
Fix Lesson-Module Relationships Script

This script helps identify and fix issues with lesson-module relationships
in the education system.
"""

from app.db.session import SessionLocal
from app.models.education import Lesson, Module, LearningPath
from sqlalchemy.orm import joinedload
from sqlalchemy import func

def analyze_lesson_module_relationships():
    """Analyze the current state of lesson-module relationships."""
    db = SessionLocal()
    try:
        print("=== LESSON-MODULE RELATIONSHIP ANALYSIS ===\n")
        
        # Get total counts
        total_lessons = db.query(func.count(Lesson.id)).scalar()
        total_modules = db.query(func.count(Module.id)).scalar()
        total_paths = db.query(func.count(LearningPath.id)).scalar()
        
        print(f"📊 OVERVIEW:")
        print(f"   Total Learning Paths: {total_paths}")
        print(f"   Total Modules: {total_modules}")
        print(f"   Total Lessons: {total_lessons}")
        print()
        
        # Check for lessons without module_id
        orphaned_lessons = db.query(Lesson).filter(Lesson.module_id.is_(None)).all()
        print(f"🚨 ORPHANED LESSONS (no module_id): {len(orphaned_lessons)}")
        if orphaned_lessons:
            for lesson in orphaned_lessons:
                print(f"   - Lesson ID {lesson.id}: '{lesson.title}'")
            print()
        
        # Check for lessons with invalid module_id
        lessons_with_invalid_modules = db.query(Lesson).outerjoin(Module).filter(
            Lesson.module_id.isnot(None),
            Module.id.is_(None)
        ).all()
        print(f"🚨 LESSONS WITH INVALID MODULE_ID: {len(lessons_with_invalid_modules)}")
        if lessons_with_invalid_modules:
            for lesson in lessons_with_invalid_modules:
                print(f"   - Lesson ID {lesson.id}: '{lesson.title}' (module_id: {lesson.module_id})")
            print()
        
        # Check for modules without learning paths
        orphaned_modules = db.query(Module).outerjoin(LearningPath).filter(
            Module.learning_path_id.isnot(None),
            LearningPath.id.is_(None)
        ).all()
        print(f"🚨 MODULES WITH INVALID LEARNING_PATH_ID: {len(orphaned_modules)}")
        if orphaned_modules:
            for module in orphaned_modules:
                print(f"   - Module ID {module.id}: '{module.title}' (learning_path_id: {module.learning_path_id})")
            print()
        
        # Show proper lesson structure
        print("✅ PROPERLY CONNECTED LESSONS:")
        properly_connected = db.query(Lesson).options(
            joinedload(Lesson.module).joinedload(Module.learning_path)
        ).filter(Lesson.module_id.isnot(None)).all()
        
        by_path = {}
        for lesson in properly_connected:
            if lesson.module and lesson.module.learning_path:
                path_title = lesson.module.learning_path.title
                if path_title not in by_path:
                    by_path[path_title] = {}
                
                module_title = lesson.module.title
                if module_title not in by_path[path_title]:
                    by_path[path_title][module_title] = []
                
                by_path[path_title][module_title].append(lesson)
        
        for path_title, modules in by_path.items():
            print(f"   📚 {path_title}")
            for module_title, lessons in modules.items():
                print(f"      📖 {module_title} ({len(lessons)} lessons)")
                for lesson in lessons[:3]:  # Show first 3 lessons
                    content_type = "HTML" if "<" in lesson.content else "Markdown/Text"
                    print(f"         📝 {lesson.title} ({content_type})")
                if len(lessons) > 3:
                    print(f"         ... and {len(lessons) - 3} more")
            print()
        
        print(f"📈 SUMMARY:")
        print(f"   Properly connected lessons: {len(properly_connected)}")
        print(f"   Orphaned lessons: {len(orphaned_lessons)}")
        print(f"   Invalid module references: {len(lessons_with_invalid_modules)}")
        print(f"   Total issues: {len(orphaned_lessons) + len(lessons_with_invalid_modules)}")
        
        return {
            'total_lessons': total_lessons,
            'orphaned_lessons': orphaned_lessons,
            'invalid_module_lessons': lessons_with_invalid_modules,
            'properly_connected': properly_connected
        }
        
    finally:
        db.close()

def fix_orphaned_lessons():
    """Attempt to fix orphaned lessons by assigning them to modules."""
    db = SessionLocal()
    try:
        print("\n=== FIXING ORPHANED LESSONS ===\n")
        
        orphaned_lessons = db.query(Lesson).filter(Lesson.module_id.is_(None)).all()
        if not orphaned_lessons:
            print("✅ No orphaned lessons found!")
            return
        
        print(f"Found {len(orphaned_lessons)} orphaned lessons")
        
        # Get available modules
        modules = db.query(Module).options(joinedload(Module.learning_path)).all()
        if not modules:
            print("❌ No modules available to assign lessons to!")
            return
        
        print(f"Available modules: {len(modules)}")
        for i, module in enumerate(modules[:10]):  # Show first 10
            path_title = module.learning_path.title if module.learning_path else "Unknown Path"
            print(f"   {i+1}. {module.title} (in {path_title})")
        
        print("\nTo fix orphaned lessons automatically:")
        print("1. This would require business logic to determine correct assignments")
        print("2. Manual review is recommended for each lesson")
        print("3. Consider the lesson content and topic to assign to appropriate module")
        
        # For now, just report what needs to be done
        print(f"\n🔧 ACTION NEEDED:")
        print(f"   Review each orphaned lesson and manually assign to appropriate module")
        print(f"   Use the admin interface: /education/lessons/{'{lesson_id}'}/edit")
        
    finally:
        db.close()

def check_content_format():
    """Check if lesson content is in HTML or Markdown format."""
    db = SessionLocal()
    try:
        print("\n=== CONTENT FORMAT ANALYSIS ===\n")
        
        lessons = db.query(Lesson).all()
        html_count = 0
        markdown_count = 0
        plain_count = 0
        
        for lesson in lessons:
            if not lesson.content:
                continue
                
            content = lesson.content.strip()
            
            # Check for HTML indicators
            if '<' in content and '>' in content:
                html_count += 1
            # Check for Markdown indicators
            elif any(marker in content for marker in ['##', '**', '_', '```', '- ', '* ', '1. ']):
                markdown_count += 1
            else:
                plain_count += 1
        
        print(f"📊 CONTENT FORMAT DISTRIBUTION:")
        print(f"   HTML format: {html_count} lessons")
        print(f"   Markdown format: {markdown_count} lessons")
        print(f"   Plain text: {plain_count} lessons")
        print(f"   Total: {len(lessons)} lessons")
        
        if markdown_count > 0:
            print(f"\n⚠️  Found {markdown_count} lessons with Markdown content")
            print(f"   These should be converted to HTML for proper display")
            print(f"   The lesson edit interface uses a WYSIWYG editor that outputs HTML")
        
    finally:
        db.close()

def main():
    """Main function to run all analyses."""
    print("🔍 Education System Analysis & Repair Tool")
    print("=" * 50)
    
    try:
        # Run analysis
        analyze_lesson_module_relationships()
        
        # Check content format
        check_content_format()
        
        # Suggest fixes for orphaned lessons
        fix_orphaned_lessons()
        
        print("\n" + "=" * 50)
        print("✅ Analysis complete!")
        print("\n📋 RECOMMENDATIONS:")
        print("1. Use admin interface to assign orphaned lessons to modules")
        print("2. Edit lessons with Markdown content to convert to HTML")
        print("3. Check that all module-lesson relationships are logical")
        print("4. Verify content displays correctly in lesson view pages")
        
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 