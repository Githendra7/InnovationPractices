import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import {
    IntakeOutput,
    FunctionalDecomposition,
    MorphologicalChart,
    RisksTradeoffs,
    FinalReport
} from '@/lib/schemas/stages';

// Register a standard font if we want custom ones, but Helvetica is default
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.5,
        color: '#1f2937' // gray-800
    },
    header: {
        marginBottom: 20,
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5
    },
    subtitle: {
        fontSize: 10,
        color: '#6b7280'
    },
    section: {
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#111827',
        marginTop: 10,
        borderBottom: '1px solid #f3f4f6',
        paddingBottom: 4
    },
    subSectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 6,
        marginBottom: 4,
        color: '#374151'
    },
    text: {
        marginBottom: 6,
        textAlign: 'justify'
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 4
    },
    bulletPoint: {
        width: 10,
        fontSize: 10
    },
    listItemContent: {
        flex: 1
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginTop: 10,
        marginBottom: 10
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        minHeight: 25,
        alignItems: 'flex-start'
    },
    tableHeaderRow: {
        backgroundColor: '#f9fafb',
        fontWeight: 'bold'
    },
    tableCell: {
        padding: 5,
        fontSize: 9,
        borderRightWidth: 1,
        borderRightColor: '#e5e7eb',
    },
    lastCell: {
        borderRightWidth: 0
    },
    card: {
        backgroundColor: '#f9fafb',
        padding: 10,
        borderRadius: 4,
        marginBottom: 8
    },
    tag: {
        fontSize: 8,
        padding: '2 6',
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        marginRight: 4,
        color: '#374151'
    }
});

interface PDFReportProps {
    projectTitle: string;
    date: string;
    intake?: IntakeOutput;
    functional?: FunctionalDecomposition;
    morphological?: MorphologicalChart;
    risks?: RisksTradeoffs;
    final?: FinalReport;
}

const BulletList = ({ items }: { items: string[] }) => (
    <View>
        {items.map((item, i) => (
            <View key={i} style={styles.listItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.listItemContent}>{item}</Text>
            </View>
        ))}
    </View>
);

export const PDFReport = ({ projectTitle, date, intake, functional, morphological, risks, final }: PDFReportProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{projectTitle}</Text>
                <Text style={styles.subtitle}>Generated on {date} - Innovation Practices AI Report</Text>
            </View>

            {/* 1. Intake */}
            {intake && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Problem Definition</Text>
                    <View style={styles.card}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Cleaned Scope:</Text>
                        <Text style={styles.text}>{intake.cleanedIdea}</Text>
                    </View>

                    <Text style={styles.subSectionTitle}>Objectives</Text>
                    <BulletList items={intake.objectives} />

                    <Text style={styles.subSectionTitle}>Constraints</Text>
                    <BulletList items={intake.constraints} />

                    <Text style={styles.subSectionTitle}>Assumptions</Text>
                    <BulletList items={intake.assumptions} />
                </View>
            )}

            {/* 2. Functional */}
            {functional && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Functional Decomposition</Text>
                    <Text style={[styles.text, { fontWeight: 'bold' }]}>Overall Function: {functional.overallFunction}</Text>

                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeaderRow]}>
                            <Text style={[styles.tableCell, { flex: 1 }]}>Function</Text>
                            <Text style={[styles.tableCell, styles.lastCell, { flex: 2 }]}>Description</Text>
                        </View>
                        {functional.subFunctions.map((sf, i) => (
                            <View key={i} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 1 }]}>{sf.function}</Text>
                                <Text style={[styles.tableCell, styles.lastCell, { flex: 2 }]}>{sf.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </Page>

        <Page size="A4" style={styles.page}>
            {/* 3. Morphological */}
            {morphological && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Morphological Chart</Text>
                    {morphological.functionAlternatives.map((row, i) => (
                        <View key={i} style={{ marginBottom: 15 }}>
                            <Text style={[styles.subSectionTitle, { borderBottom: '1px dotted #ccc' }]}>{row.function}</Text>
                            {row.alternatives.map((alt, j) => (
                                <View key={j} style={{ paddingLeft: 10, marginBottom: 5 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Option {j + 1}: {alt.option}</Text>
                                    <Text style={{ fontSize: 9, color: 'green' }}>+ {alt.pros.join(', ')}</Text>
                                    <Text style={{ fontSize: 9, color: 'red' }}>- {alt.cons.join(', ')}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            )}

            {/* 4. Risks */}
            {risks && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Risks & Trade-offs</Text>
                    <Text style={styles.subSectionTitle}>Key Risks</Text>
                    {risks.risks.map((r, i) => (
                        <View key={i} style={styles.card}>
                            <Text style={{ fontWeight: 'bold', fontSize: 10 }}>[{r.category}] {r.risk}</Text>
                            <Text style={{ fontSize: 10, marginTop: 2 }}> Mitigation: {r.mitigation}</Text>
                        </View>
                    ))}

                    <Text style={styles.subSectionTitle}>Critical Trade-offs</Text>
                    {risks.tradeoffs.map((t, i) => (
                        <View key={i} style={{ marginBottom: 8 }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{t.decision}</Text>
                            <Text style={{ fontSize: 10 }}>A: {t.optionA} vs B: {t.optionB}</Text>
                            <Text style={{ fontSize: 9, fontStyle: 'italic', color: '#555' }}>Note: {t.notes}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* 5. Final Report */}
            {final && (
                <View style={[styles.section, { marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: '#047857' }]}>5. Executive Summary</Text>
                    <View style={{ padding: 10, backgroundColor: '#ECFDF5', borderRadius: 5 }}>
                        <Text style={styles.text}>{final.summary}</Text>
                    </View>

                    <Text style={styles.subSectionTitle}>Recommended Next Steps</Text>
                    <BulletList items={final.recommendedNextSteps} />
                </View>
            )}
        </Page>
    </Document>
);
