#!/usr/bin/env python3
"""
Vertical-Slice Feature Module Scaffolder (scaffold_module.py)
Generates canonical, decoupled feature module skeletons in 0.1s according to
Proactive Code Architect standards (types -> utils -> state -> model -> view -> index).
"""

import sys
import argparse
from pathlib import Path

# Windows Unicode stdout safety
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

def to_camel(name: str) -> str:
    parts = name.replace("_", "-").split("-")
    return parts[0].capitalize() + "".join(p.capitalize() for p in parts[1:])

def scaffold_react_ts(target_dir: Path, name: str):
    clean_name = name.lower().replace("_", "-")
    comp_name = to_camel(clean_name)
    mod_dir = target_dir / clean_name
    mod_dir.mkdir(parents=True, exist_ok=True)

    # 1. Types
    types_file = mod_dir / f"{clean_name}-types.ts"
    types_file.write_text(f"""/**
 * {comp_name} Type Definitions & DTOs
 */

export interface I{comp_name}Props {{
    id?: string;
    className?: string;
    onAction?: () => void;
}}

export interface {comp_name}State {{
    isLoading: boolean;
    error: string | null;
}}
""", encoding="utf-8")

    # 2. Utils
    utils_file = mod_dir / f"{clean_name}-utils.ts"
    utils_file.write_text(f"""/**
 * {comp_name} Pure Helper Functions (Zero framework dependencies)
 */

export function format{comp_name}Data(input: string): string {{
    return input.trim();
}}
""", encoding="utf-8")

    # 3. Atoms / State
    atoms_file = mod_dir / f"{clean_name}-atoms.ts"
    atoms_file.write_text(f"""/**
 * {comp_name} Scoped State Atoms & Stores
 */

import {{ {comp_name}State }} from './{clean_name}-types';

export const initial{comp_name}State: {comp_name}State = {{
    isLoading: false,
    error: null
}};
""", encoding="utf-8")

    # 4. Model / ViewModel Hook
    model_file = mod_dir / f"{clean_name}-model.ts"
    model_file.write_text(f"""/**
 * {comp_name} ViewModel & Business Logic Hook
 */

import {{ useState, useCallback }} from 'react';
import {{ {comp_name}State, I{comp_name}Props }} from './{clean_name}-types';
import {{ initial{comp_name}State }} from './{clean_name}-atoms';

export function use{comp_name}Model(props: I{comp_name}Props) {{
    const [state, setState] = useState<{comp_name}State>(initial{comp_name}State);

    const handleAction = useCallback(() => {{
        if (props.onAction) props.onAction();
    }}, [props]);

    return {{
        ...state,
        handleAction
    }};
}}
""", encoding="utf-8")

    # 5. View
    view_file = mod_dir / f"{clean_name}-view.tsx"
    view_file.write_text(f"""/**
 * {comp_name} Main Presentation Component
 */

import React from 'react';
import {{ I{comp_name}Props }} from './{clean_name}-types';
import {{ use{comp_name}Model }} from './{clean_name}-model';

export const {comp_name}View: React.FC<I{comp_name}Props> = (props) => {{
    const {{ isLoading, error, handleAction }} = use{comp_name}Model(props);

    if (isLoading) return <div>Loading {comp_name}...</div>;
    if (error) return <div>Error: {{error}}</div>;

    return (
        <div className={{{clean_name}-container ${{props.className || ''}}`}}>
            <h3>{comp_name}</h3>
            <button onClick={{handleAction}}>Execute Action</button>
        </div>
    );
}};
""", encoding="utf-8")

    # 6. Index (Barrel Re-export)
    index_file = mod_dir / "index.ts"
    index_file.write_text(f"""/**
 * {comp_name} Feature Module Public API
 */

export * from './{clean_name}-types';
export * from './{clean_name}-utils';
export * from './{clean_name}-view';
""", encoding="utf-8")

    print(f"✅ Created React/TS Feature Module at: {mod_dir}")

def scaffold_python(target_dir: Path, name: str):
    clean_name = name.lower().replace("-", "_")
    class_name = to_camel(clean_name)
    mod_dir = target_dir / clean_name
    mod_dir.mkdir(parents=True, exist_ok=True)

    # 1. Schemas
    (mod_dir / "schemas.py").write_text(f"""from pydantic import BaseModel, Field
from typing import Optional

class {class_name}Base(BaseModel):
    name: str = Field(..., description="{class_name} name")

class {class_name}Create({class_name}Base):
    pass

class {class_name}Response({class_name}Base):
    id: str
    class Config:
        from_attributes = True
""", encoding="utf-8")

    # 2. Repository
    (mod_dir / "repository.py").write_text(f"""from typing import List, Optional

class {class_name}Repository:
    def __init__(self, db_session=None):
        self.db = db_session

    async def get_by_id(self, entity_id: str) -> Optional[dict]:
        return {{"id": entity_id, "name": "sample"}}
""", encoding="utf-8")

    # 3. Service
    (mod_dir / "service.py").write_text(f"""from .repository import {class_name}Repository
from .schemas import {class_name}Create, {class_name}Response

class {class_name}Service:
    def __init__(self, repo: {class_name}Repository):
        self.repo = repo

    async def fetch_item(self, item_id: str) -> {class_name}Response:
        data = await self.repo.get_by_id(item_id)
        return {class_name}Response(**data)
""", encoding="utf-8")

    # 4. Router
    (mod_dir / "router.py").write_text(f"""from fastapi import APIRouter, Depends
from .schemas import {class_name}Response
from .service import {class_name}Service
from .repository import {class_name}Repository

router = APIRouter(prefix="/{clean_name}", tags=["{clean_name}"])

def get_service():
    return {class_name}Service({class_name}Repository())

@router.get("/{{item_id}}", response_model={class_name}Response)
async def get_{clean_name}(item_id: str, service: {class_name}Service = Depends(get_service)):
    return await service.fetch_item(item_id)
""", encoding="utf-8")

    # 5. __init__.py
    (mod_dir / "__init__.py").write_text(f"""from .router import router as {clean_name}_router
from .service import {class_name}Service
from .schemas import {class_name}Response

__all__ = ["{clean_name}_router", "{class_name}Service", "{class_name}Response"]
""", encoding="utf-8")

    print(f"✅ Created Python Feature Module at: {mod_dir}")

def main():
    parser = argparse.ArgumentParser(description="Scaffold decoupled vertical-slice feature modules.")
    parser.add_argument("--name", "-n", required=True, help="Feature module name (e.g. user-profile, cart-panel)")
    parser.add_argument("--stack", "-s", choices=["react-ts", "python", "generic"], default="react-ts", help="Technology stack")
    parser.add_argument("--target-dir", "-t", default=".", help="Base output directory (default: current dir)")

    args = parser.parse_args()
    base_dir = Path(args.target_dir).resolve()

    if args.stack == "react-ts" or args.stack == "generic":
        scaffold_react_ts(base_dir, args.name)
    elif args.stack == "python":
        scaffold_python(base_dir, args.name)

if __name__ == "__main__":
    main()
