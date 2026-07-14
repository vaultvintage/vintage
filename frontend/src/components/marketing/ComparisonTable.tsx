import Link from "next/link";
import { IconCheck, IconClose } from "@/components/Icons";

export interface CmpRow {
  label: string;
  values: boolean[];
}

export function ComparisonTable({
  columns,
  rows,
  detailLinks,
}: {
  columns: string[];
  rows: CmpRow[];
  detailLinks?: { label: string; href: string }[];
}) {
  return (
    <div className="cmp-wrap">
      <table className="cmp">
        <thead>
          <tr>
            <th />
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              {r.values.map((v, i) => (
                <td key={i}>
                  {v ? (
                    <span className="cmp-yes"><IconCheck width={15} height={15} /></span>
                  ) : (
                    <span className="cmp-no"><IconClose width={14} height={14} /></span>
                  )}
                </td>
              ))}
            </tr>
          ))}
          {detailLinks && (
            <tr className="cmp-detail-row">
              <td />
              {detailLinks.map((d) => (
                <td key={d.label}>
                  <Link href={d.href}>{d.label}</Link>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
