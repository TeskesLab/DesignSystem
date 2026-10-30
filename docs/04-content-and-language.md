# Content and language

Use direct language. Tell the user what happened, what it affects, and the next useful action. Technical precision is welcome when it helps a decision.

| Avoid | Prefer |
| --- | --- |
| Error 0x42 | Could not read the target. Check the connection, then retry. Put error 0x42 in details. |
| Something went wrong | Could not save the note. Your changes are still here. |
| Submit | Save settings / Start read / Create note |
| Success | Backup saved / Changes applied |
| Offline | Connection lost. Last update: 14:32. |
| Verified (when only published) | Published / Review pending |
| recovery.md as the only title | A reviewed descriptive title; original filename remains in metadata |

Buttons use verbs and objects. Dialog titles name the operation and target. Avoid double negatives, unexplained acronyms, generic “OK” for consequential actions, and humor in errors.

Use sentence case in UI. Short navigation section labels may be uppercase. Keep product names and technical identifiers unchanged. Use the user's language consistently; don't mix translated navigation with untranslated errors accidentally.

## English / Portuguese reference

| Intent | English | Português |
| --- | --- | --- |
| Save | Save changes | Salvar alterações |
| Cancel request | Cancel operation | Cancelar operação |
| Waiting for cancel acknowledgement | Cancellation requested | Cancelamento solicitado |
| Connection uncertainty | Status unknown | Estado desconhecido |
| Source review | Needs review | Precisa de revisão |
| Safe destructive dismissal | Keep contents | Manter conteúdo |
| No results | No matching references | Nenhuma referência encontrada |

These are wording examples, not a full translation catalog. Localize plural forms and dates through the platform. Test longer Portuguese labels at narrow widths and large text sizes.

Units: use a space between value and unit; distinguish MB from MiB, and Mb/s from MB/s. Preserve exact addresses and hashes. A truncated ID must have a reliable full-value affordance. Copy the original value, never its shortened display.

MisterMal's sarcastic or absurdist character belongs in optional editorial contexts. Operational copy remains unambiguous. Do not invent attribution to MisterMal, Lucas, a reviewer, or a source.
