import { noDataIcon } from "../icons/icon";

export default function ProductTableNoData ({
    title = "No records found",
    subtitle = "There is nothing to show yet.",
  }) {
    return (
    <div className="flex flex-col select-none items-center justify-center py-10 px-4 text-center w-full">
      <img
        src={noDataIcon}
        alt=""
        className="mb-4 w-28 max-w-[180px] h-auto select-none pointer-events-none"
        draggable={false}
      />
      <p className="plusJakara_semibold text_secondary text-sm mb-1">{title}</p>
      {subtitle ? (
        <p className="inter_regular text_secondary text-xs opacity-90 max-w-sm">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}