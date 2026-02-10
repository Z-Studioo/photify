import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  itemName?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  itemName = 'items',
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className='flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200'>
      <div className='text-sm text-gray-600'>
        Showing {startItem} to {endItem} of {totalItems} {itemName}
      </div>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='h-8 w-8 p-0'
        >
          <ChevronLeft className='w-4 h-4' />
        </Button>

        {getPageNumbers().map((page, index) => {
          const key = typeof page === 'number' ? `page-${page}` : `ellipsis-${index}`;
          return (
            <span key={key}>
              {typeof page === 'number' ? (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => onPageChange(page)}
                  className={`h-8 w-8 p-0 ${
                    currentPage === page
                      ? 'bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
                      : ''
                  }`}
                >
                  {page}
                </Button>
              ) : (
                <span className='px-2 text-gray-400'>...</span>
              )}
            </span>
          );
        })}

        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='h-8 w-8 p-0'
        >
          <ChevronRight className='w-4 h-4' />
        </Button>
      </div>
    </div>
  );
}
