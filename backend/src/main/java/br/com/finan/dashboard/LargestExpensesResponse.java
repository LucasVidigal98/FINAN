package br.com.finan.dashboard;

import java.util.List;

public record LargestExpensesResponse(String period, List<LargestExpense> expenses) {
}
