from typing import Literal

from pydantic import BaseModel

from pm_backend.models import BoardData, Card, Column, validate_board

OperationType = Literal[
    "rename_column",
    "add_card",
    "update_card",
    "move_card",
    "delete_card",
]


class BoardOperation(BaseModel):
    type: OperationType
    columnId: str | None = None
    cardId: str | None = None
    title: str | None = None
    details: str | None = None


def _new_card_id(existing: BoardData) -> str:
    index = len(existing.cards) + 1
    while f"card-{index}" in existing.cards:
        index += 1
    return f"card-{index}"


def apply_operations(board: BoardData, operations: list[BoardOperation]) -> BoardData:
    updated = board.model_copy(deep=True)
    columns_by_id = {column.id: column for column in updated.columns}

    for op in operations:
        if op.type == "rename_column":
            if not op.columnId or not op.title:
                raise ValueError("rename_column requires columnId and title")
            column = columns_by_id.get(op.columnId)
            if column is None:
                raise ValueError(f"Unknown column {op.columnId!r}")
            column.title = op.title
            continue

        if op.type == "add_card":
            if not op.columnId or not op.title:
                raise ValueError("add_card requires columnId and title")
            column = columns_by_id.get(op.columnId)
            if column is None:
                raise ValueError(f"Unknown column {op.columnId!r}")
            card_id = _new_card_id(updated)
            updated.cards[card_id] = Card(
                id=card_id,
                title=op.title,
                details=op.details or "",
            )
            column.cardIds.append(card_id)
            continue

        if op.type == "update_card":
            if not op.cardId:
                raise ValueError("update_card requires cardId")
            card = updated.cards.get(op.cardId)
            if card is None:
                raise ValueError(f"Unknown card {op.cardId!r}")
            if op.title is not None:
                card.title = op.title
            if op.details is not None:
                card.details = op.details
            continue

        if op.type == "move_card":
            if not op.cardId or not op.columnId:
                raise ValueError("move_card requires cardId and columnId")
            if op.cardId not in updated.cards:
                raise ValueError(f"Unknown card {op.cardId!r}")
            target = columns_by_id.get(op.columnId)
            if target is None:
                raise ValueError(f"Unknown column {op.columnId!r}")
            for column in updated.columns:
                if op.cardId in column.cardIds:
                    column.cardIds = [cid for cid in column.cardIds if cid != op.cardId]
            if op.cardId not in target.cardIds:
                target.cardIds.append(op.cardId)
            continue

        if op.type == "delete_card":
            if not op.cardId:
                raise ValueError("delete_card requires cardId")
            if op.cardId not in updated.cards:
                raise ValueError(f"Unknown card {op.cardId!r}")
            del updated.cards[op.cardId]
            for column in updated.columns:
                column.cardIds = [cid for cid in column.cardIds if cid != op.cardId]
            continue

        raise ValueError(f"Unknown operation type {op.type!r}")

    validate_board(updated)
    return updated
