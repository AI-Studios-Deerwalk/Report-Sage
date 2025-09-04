from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from database.connection import get_db_session
from crud.document_rules import document_rules
from schemas.document_rules import (
    DocumentRuleCreate, 
    DocumentRuleUpdate, 
    DocumentRule, 
    DocumentRuleResponse,
    DocumentRuleListResponse
)

router = APIRouter(prefix="/document-rules", tags=["Document Rules"])

@router.post("/", response_model=DocumentRuleResponse)
async def create_document_rule(
    rule: DocumentRuleCreate, 
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new document rule"""
    try:
        # Check if chunk_id already exists
        existing_rule = await document_rules.get_by_chunk_id(db, rule.chunk_id)
        if existing_rule:
            raise HTTPException(
                status_code=400, 
                detail=f"Rule with chunk_id '{rule.chunk_id}' already exists"
            )
        
        created_rule = await document_rules.create_rule(db, rule)
        return DocumentRuleResponse(
            success=True,
            data=created_rule,
            message="Document rule created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{rule_id}", response_model=DocumentRuleResponse)
async def get_document_rule(rule_id: int, db: AsyncSession = Depends(get_db_session)):
    """Get a document rule by ID"""
    rule = await document_rules.get_by_id(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Document rule not found")
    
    return DocumentRuleResponse(
        success=True,
        data=rule,
        message="Document rule retrieved successfully"
    )

@router.get("/chunk/{chunk_id}", response_model=DocumentRuleResponse)
async def get_document_rule_by_chunk(
    chunk_id: str, 
    db: AsyncSession = Depends(get_db_session)
):
    """Get a document rule by chunk ID"""
    rule = await document_rules.get_by_chunk_id(db, chunk_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Document rule not found")
    
    return DocumentRuleResponse(
        success=True,
        data=rule,
        message="Document rule retrieved successfully"
    )

@router.get("/university/{university}", response_model=DocumentRuleListResponse)
async def get_rules_by_university(
    university: str,
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all rules for a specific university"""
    rules = await document_rules.get_by_university(db, university)
    total = len(rules)
    
    # Apply pagination
    paginated_rules = rules[skip:skip + limit]
    
    return DocumentRuleListResponse(
        success=True,
        data=paginated_rules,
        total=total,
        message=f"Retrieved {len(paginated_rules)} rules for {university}"
    )

@router.get("/university/{university}/degree/{degree_program}", response_model=DocumentRuleListResponse)
async def get_rules_by_degree_program(
    university: str,
    degree_program: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get rules for a specific degree program in a university"""
    rules = await document_rules.get_by_degree_program(db, university, degree_program)
    
    return DocumentRuleListResponse(
        success=True,
        data=rules,
        total=len(rules),
        message=f"Retrieved {len(rules)} rules for {university} {degree_program}"
    )

@router.get("/university/{university}/degree/{degree_program}/chapter/{chapter}", response_model=DocumentRuleListResponse)
async def get_rules_by_university_degree_and_chapter(
    university: str,
    degree_program: str,
    chapter: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get rules for a specific university, degree program and chapter"""
    rules = await document_rules.get_by_university_degree_and_chapter(db, university, degree_program, chapter)
    
    return DocumentRuleListResponse(
        success=True,
        data=rules,
        total=len(rules),
        message=f"Retrieved {len(rules)} rules for {university} {degree_program} Chapter {chapter}"
    )

@router.get("/university/{university}/chapter/{chapter}", response_model=DocumentRuleListResponse)
async def get_rules_by_chapter(
    university: str,
    chapter: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get rules for a specific chapter in a university"""
    rules = await document_rules.get_by_chapter(db, university, chapter)
    
    return DocumentRuleListResponse(
        success=True,
        data=rules,
        total=len(rules),
        message=f"Retrieved {len(rules)} rules for {university} Chapter {chapter}"
    )

@router.get("/university/{university}/section/{section}", response_model=DocumentRuleListResponse)
async def get_rules_by_section(
    university: str,
    section: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get rules for a specific section in a university"""
    rules = await document_rules.get_by_section(db, university, section)
    
    return DocumentRuleListResponse(
        success=True,
        data=rules,
        total=len(rules),
        message=f"Retrieved {len(rules)} rules for {university} Section {section}"
    )

@router.get("/university/{university}/hierarchy")
async def get_rule_hierarchy(university: str, db: AsyncSession = Depends(get_db_session)):
    """Get organized rule hierarchy for a university"""
    hierarchy = await document_rules.get_rule_hierarchy(db, university)
    
    return {
        "success": True,
        "data": hierarchy,
        "university": university,
        "message": f"Rule hierarchy retrieved for {university}"
    }

@router.get("/university/{university}/search")
async def search_rules(
    university: str,
    query: str = Query(..., description="Search term"),
    db: AsyncSession = Depends(get_db_session)
):
    """Search rules by text in title, rules, or content"""
    rules = await document_rules.search_rules(db, university, query)
    
    return {
        "success": True,
        "data": rules,
        "total": len(rules),
        "query": query,
        "university": university,
        "message": f"Found {len(rules)} rules matching '{query}'"
    }

@router.put("/{rule_id}", response_model=DocumentRuleResponse)
async def update_document_rule(
    rule_id: int,
    rule: DocumentRuleUpdate,
    db: AsyncSession = Depends(get_db_session)
):
    """Update an existing document rule"""
    updated_rule = await document_rules.update_rule(db, rule_id, rule)
    if not updated_rule:
        raise HTTPException(status_code=404, detail="Document rule not found")
    
    return DocumentRuleResponse(
        success=True,
        data=updated_rule,
        message="Document rule updated successfully"
    )

@router.delete("/{rule_id}")
async def delete_document_rule(rule_id: int, db: AsyncSession = Depends(get_db_session)):
    """Delete a document rule"""
    success = await document_rules.delete_rule(db, rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document rule not found")
    
    return {
        "success": True,
        "message": "Document rule deleted successfully"
    }

@router.patch("/{rule_id}/deactivate")
async def deactivate_document_rule(rule_id: int, db: AsyncSession = Depends(get_db_session)):
    """Deactivate a document rule (soft delete)"""
    rule = await document_rules.deactivate_rule(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Document rule not found")
    
    return {
        "success": True,
        "message": "Document rule deactivated successfully"
    }

@router.get("/", response_model=DocumentRuleListResponse)
async def get_all_document_rules(
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all document rules with pagination"""
    rules = await document_rules.get_all_rules(db, skip=skip, limit=limit)
    total = len(rules)
    
    return DocumentRuleListResponse(
        success=True,
        data=rules,
        total=total,
        message=f"Retrieved {len(rules)} document rules"
    )
