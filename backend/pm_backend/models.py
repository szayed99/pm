from pydantic import BaseModel, Field


class Card(BaseModel):
    id: str
    title: str
    details: str


class Column(BaseModel):
    id: str
    title: str
    cardIds: list[str] = Field(default_factory=list)


class BoardData(BaseModel):
    columns: list[Column]
    cards: dict[str, Card]


def validate_board(board: BoardData) -> None:
    for column in board.columns:
        for card_id in column.cardIds:
            if card_id not in board.cards:
                raise ValueError(f"Unknown card id {card_id!r} in column {column.id!r}")
    for key, card in board.cards.items():
        if key != card.id:
            raise ValueError(f"Card key {key!r} does not match card id {card.id!r}")
